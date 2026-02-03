'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  getAgentDetail,
  type Period,
  type AgentDetailData,
  type FunnelStage,
} from '@/app/actions/analytics'
import { formatIDR } from '@/lib/constants'

export default function AgentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const [period, setPeriod] = useState<Period>('month')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AgentDetailData | null>(null)

  useEffect(() => {
    if (agentId) {
      loadAgentData()
    }
  }, [agentId, period])

  const loadAgentData = async () => {
    setLoading(true)
    try {
      const agentData = await getAgentDetail(agentId, period)
      if (!agentData) {
        router.push('/admin/analytics')
        return
      }
      setData(agentData)
    } catch (error) {
      console.error('Failed to load agent data:', error)
      router.push('/admin/analytics')
    } finally {
      setLoading(false)
    }
  }

  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case 'month': return 'Bulan Ini'
      case 'quarter': return 'Kuartal Ini'
      case 'year': return 'Tahun Ini'
      case 'all': return 'Semua Waktu'
    }
  }

  const getChangeLabel = (current: number, previous: number | null | undefined) => {
    if (previous === null || previous === undefined || previous === 0) return '-'
    const change = ((current - previous) / previous) * 100
    if (change > 0) return `+${change.toFixed(1)}%`
    return `${change.toFixed(1)}%`
  }

  const getChangeColor = (current: number, previous: number | null | undefined) => {
    if (previous === null || previous === undefined || previous === 0) return '#6b7280'
    const change = current - previous
    if (change > 0) return '#10b981'
    if (change < 0) return '#ef4444'
    return '#6b7280'
  }

  if (loading) {
    return (
      <div className="app-container">
        <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div className="spinner" />
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { currentPeriod, previousPeriod, funnelBreakdown, activityBreakdown, bestSources, closedDeals, comparisonWithTeam } = data

  // Prepare funnel chart data
  const funnelChartData = funnelBreakdown.filter(f => f.count > 0)

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        background: '#1f2937',
        color: 'white',
        padding: '20px',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Admin Panel</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link href="/admin" style={{ color: '#9ca3af', textDecoration: 'none', padding: '8px 12px', borderRadius: '6px' }}>
            Dashboard
          </Link>
          <Link href="/admin/analytics" style={{ color: 'white', background: '#374151', textDecoration: 'none', padding: '8px 12px', borderRadius: '6px' }}>
            Analytics
          </Link>
          <Link href="/settings/users" style={{ color: '#9ca3af', textDecoration: 'none', padding: '8px 12px', borderRadius: '6px' }}>
            Users
          </Link>
        </nav>
      </aside>

      <main className="main-content" style={{ marginLeft: '240px' }}>
        <header className="header" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/admin/analytics')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              ← Kembali
            </button>
            <div>
              <h1 style={{ margin: 0 }}>{data.agent.name}</h1>
              <p style={{ margin: 0, color: '#6b7280' }}>{data.agent.email}</p>
            </div>
          </div>
          <div className="header-actions">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              <option value="month">Bulan Ini</option>
              <option value="quarter">Kuartal Ini</option>
              <option value="year">Tahun Ini</option>
              <option value="all">Semua Waktu</option>
            </select>
          </div>
        </header>

        {/* Performance Summary Cards */}
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{currentPeriod.totalLeads}</h3>
              <p>Total Leads</p>
              <small style={{ color: getChangeColor(currentPeriod.totalLeads, previousPeriod?.totalLeads) }}>
                {getChangeLabel(currentPeriod.totalLeads, previousPeriod?.totalLeads)} vs periode lalu
              </small>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{currentPeriod.closedDeals}</h3>
              <p>Deals Closed</p>
              <small style={{ color: getChangeColor(currentPeriod.closedDeals, previousPeriod?.closedDeals) }}>
                {getChangeLabel(currentPeriod.closedDeals, previousPeriod?.closedDeals)} vs periode lalu
              </small>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{currentPeriod.conversionRate}%</h3>
              <p>Conversion Rate</p>
              <small style={{ color: getChangeColor(currentPeriod.conversionRate, previousPeriod?.conversionRate) }}>
                {getChangeLabel(currentPeriod.conversionRate, previousPeriod?.conversionRate)} vs periode lalu
              </small>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>{formatIDR(currentPeriod.totalCommission)}</h3>
              <p>Total Commission</p>
              <small style={{ color: getChangeColor(currentPeriod.totalCommission, previousPeriod?.totalCommission) }}>
                {getChangeLabel(currentPeriod.totalCommission, previousPeriod?.totalCommission)} vs periode lalu
              </small>
            </div>
          </div>
        </div>

        {/* Team Comparison */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Comparison with Team Average</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6b7280' }}>Conversion Rate</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: comparisonWithTeam.conversionRateDiff >= 0 ? '#10b981' : '#ef4444' }}>
                {comparisonWithTeam.conversionRateDiff >= 0 ? '+' : ''}{comparisonWithTeam.conversionRateDiff}%
              </p>
              <small style={{ color: '#6b7280' }}>{comparisonWithTeam.conversionRateDiff >= 0 ? 'Above' : 'Below'} team average</small>
            </div>
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6b7280' }}>Revenue</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: comparisonWithTeam.revenueDiff >= 0 ? '#10b981' : '#ef4444' }}>
                {comparisonWithTeam.revenueDiff >= 0 ? '+' : ''}{formatIDR(comparisonWithTeam.revenueDiff)}
              </p>
              <small style={{ color: '#6b7280' }}>{comparisonWithTeam.revenueDiff >= 0 ? 'Above' : 'Below'} team average</small>
            </div>
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6b7280' }}>Deals</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: comparisonWithTeam.dealsDiff >= 0 ? '#10b981' : '#ef4444' }}>
                {comparisonWithTeam.dealsDiff >= 0 ? '+' : ''}{comparisonWithTeam.dealsDiff}
              </p>
              <small style={{ color: '#6b7280' }}>{comparisonWithTeam.dealsDiff >= 0 ? 'Above' : 'Below'} team average</small>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
          {/* Funnel Breakdown */}
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Funnel Breakdown</h3>
            {funnelChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={funnelChartData} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis type="category" dataKey="stage" width={80} tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip
                    formatter={(value: number | undefined, name: string | undefined) => [(value ?? 0), 'Leads']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>Belum ada data funnel</p>
            )}
            <div style={{ marginTop: '16px' }}>
              {funnelBreakdown.map((stage) => (
                stage.count > 0 && (
                  <div key={stage.stage} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>{stage.stage}</span>
                    <span style={{ color: '#6b7280' }}>{stage.count} leads ({stage.percentage}%)</span>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Activity Analysis</h3>
            {activityBreakdown.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activityBreakdown.map((activity) => (
                  <div key={activity.type} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 500 }}>{activity.type}</p>
                    </div>
                    <div style={{
                      width: `${Math.max((activity.count / currentPeriod.activitiesCount) * 100, 5)}%`,
                      background: '#3b82f6',
                      height: '24px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '8px',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>
                      {activity.count}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                    Total: <strong>{currentPeriod.activitiesCount}</strong> activities recorded
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>Belum ada data aktivitas</p>
            )}
          </div>
        </div>

        {/* Best Performing Sources */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Best Performing Lead Sources</h3>
          {bestSources.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Leads</th>
                    <th>Closed</th>
                    <th>Conversion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSources.map((source) => (
                    <tr key={source.source}>
                      <td>{source.source}</td>
                      <td>{source.leads}</td>
                      <td>
                        <span className="status status-closed">{source.closed}</span>
                      </td>
                      <td>
                        <span style={{
                          color: source.conversionRate >= 20 ? '#10b981' : source.conversionRate >= 10 ? '#f59e0b' : '#ef4444',
                          fontWeight: 600,
                        }}>
                          {source.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Belum ada data source</p>
          )}
        </div>

        {/* Closed Deals List */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Closed Deals ({getPeriodLabel(period)})</h3>
          {closedDeals.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Lead Name</th>
                    <th>Property</th>
                    <th>Deal Value</th>
                    <th>Commission</th>
                    <th>Days to Close</th>
                    <th>Closed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {closedDeals.map((deal) => (
                    <tr key={deal.id}>
                      <td>{deal.leadName}</td>
                      <td>{deal.propertyTitle}</td>
                      <td>{formatIDR(deal.dealValue)}</td>
                      <td style={{ fontWeight: 600, color: '#10b981' }}>
                        {formatIDR(deal.commissionAmount)}
                      </td>
                      <td>
                        <span style={{
                          color: deal.daysToClose <= 30 ? '#10b981' : deal.daysToClose <= 60 ? '#f59e0b' : '#ef4444',
                          fontWeight: 500,
                        }}>
                          {deal.daysToClose} hari
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: '#6b7280' }}>
                        {new Date(deal.closedDate).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Belum ada deals closed</p>
          )}
        </div>

        {/* Key Metrics Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <div className="card">
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>Avg Days to Close</h4>
            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              {currentPeriod.avgDaysToClose}
            </p>
            <small style={{ color: '#6b7280' }}>Rata-rata siklus penjualan</small>
          </div>
          <div className="card">
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>Appointments</h4>
            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              {currentPeriod.appointmentsCount}
            </p>
            <small style={{ color: '#6b7280' }}>Jadwal survei dibuat</small>
          </div>
          <div className="card">
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>Active Deals</h4>
            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              {currentPeriod.viewingLeads + currentPeriod.negotiationLeads}
            </p>
            <small style={{ color: '#6b7280' }}>Viewing + Negotiation</small>
          </div>
          <div className="card">
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>Lost Deals</h4>
            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#ef4444' }}>
              {currentPeriod.lostDeals}
            </p>
            <small style={{ color: '#6b7280' }}>Leads dengan status Batal</small>
          </div>
        </div>
      </main>

      <style jsx>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
