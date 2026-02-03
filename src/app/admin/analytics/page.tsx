'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  RevenueChart,
  ConversionChart,
  TrendChart,
  SourceChart,
  VelocityChart,
} from '@/components/analytics'
import {
  getAgentPerformance,
  getTeamOverview,
  getLeaderboard,
  getDealTrendsByAgent,
  getSourcePerformanceAll,
  getPipelineVelocity,
  type Period,
  type AgentPerformanceData,
  type TeamOverviewData,
  type LeaderboardMetric,
} from '@/app/actions/analytics'
import { formatIDR } from '@/lib/constants'

export default function AnalyticsDashboard() {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('month')
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<TeamOverviewData | null>(null)
  const [performance, setPerformance] = useState<AgentPerformanceData[]>([])
  const [leaderboardMetric, setLeaderboardMetric] = useState<LeaderboardMetric>('revenue')
  const [trendData, setTrendData] = useState<any[]>([])
  const [sourceData, setSourceData] = useState<any[]>([])
  const [velocityData, setVelocityData] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    setLoading(true)
    try {
      const [overviewData, performanceData, trends, sources, velocity] = await Promise.all([
        getTeamOverview(period),
        getAgentPerformance(period),
        getDealTrendsByAgent(period),
        getSourcePerformanceAll(period),
        getPipelineVelocity(period),
      ])
      setOverview(overviewData)
      setPerformance(performanceData)
      setTrendData(trends)
      setSourceData(sources)
      setVelocityData(velocity)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      // If we get a redirect error, it means user is not admin
      if (error instanceof Error && error.message.includes('redirect')) {
        router.push('/dashboard')
      }
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

  if (loading) {
    return (
      <div className="app-container">
        <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div className="spinner" />
        </div>
      </div>
    )
  }

  if (!overview) {
    return null
  }

  // Calculate team average conversion rate
  const teamAvgConversion = performance.reduce((sum, p) => sum + p.conversionRate, 0) / performance.length || 0

  // Sort performance for leaderboard
  const sortedByRevenue = [...performance].sort((a, b) => b.totalCommission - a.totalCommission)
  const sortedByDeals = [...performance].sort((a, b) => b.closedDeals - a.closedDeals)
  const sortedByConversion = [...performance]
    .filter((p) => p.totalLeads >= 3)
    .sort((a, b) => b.conversionRate - a.conversionRate)

  return (
    <div className="app-container">
      {/* Sidebar will be rendered by layout */}
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
          <div className="header-title">
            <h1>Analytics Dashboard</h1>
            <p>Monitor team performance and sales metrics</p>
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

        {/* Overview Cards */}
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{overview.totalLeads}</h3>
              <p>Total Leads ({getPeriodLabel(period)})</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{overview.totalClosed}</h3>
              <p>Deals Closed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{overview.teamConversionRate}%</h3>
              <p>Team Conversion Rate</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>{formatIDR(overview.totalRevenue)}</h3>
              <p>Total Commission</p>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Revenue by Agent</h3>
            <RevenueChart data={performance} maxBars={10} />
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Conversion Rate Comparison</h3>
            <ConversionChart data={performance} teamAverage={teamAvgConversion} />
          </div>
        </div>

        {/* Deal Trends Chart */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Deal Trends Over Time</h3>
          <TrendChart data={trendData} topAgents={5} />
        </div>

        {/* Charts Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Lead Source Performance</h3>
            <SourceChart data={sourceData} />
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Pipeline Velocity (Days in Stage)</h3>
            <VelocityChart data={velocityData} maxAgents={8} />
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Leaderboard</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setLeaderboardMetric('revenue')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: leaderboardMetric === 'revenue' ? '#3b82f6' : 'white',
                  color: leaderboardMetric === 'revenue' ? 'white' : '#1f2937',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Revenue
              </button>
              <button
                onClick={() => setLeaderboardMetric('deals')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: leaderboardMetric === 'deals' ? '#3b82f6' : 'white',
                  color: leaderboardMetric === 'deals' ? 'white' : '#1f2937',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Deals
              </button>
              <button
                onClick={() => setLeaderboardMetric('conversion')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: leaderboardMetric === 'conversion' ? '#3b82f6' : 'white',
                  color: leaderboardMetric === 'conversion' ? 'white' : '#1f2937',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Conversion
              </button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Agent</th>
                  <th>Leads</th>
                  <th>Contacted</th>
                  <th>Viewing</th>
                  <th>Negotiation</th>
                  <th>Closed</th>
                  <th>Conv. Rate</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(leaderboardMetric === 'revenue' ? sortedByRevenue :
                  leaderboardMetric === 'deals' ? sortedByDeals :
                  sortedByConversion
                ).map((agent, index) => (
                  <tr
                    key={agent.agentId}
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/admin/analytics/agent/${agent.agentId}?period=${period}`)}
                  >
                    <td>
                      {index === 0 && <span style={{ fontSize: '18px' }}>🥇</span>}
                      {index === 1 && <span style={{ fontSize: '18px' }}>🥈</span>}
                      {index === 2 && <span style={{ fontSize: '18px' }}>🥉</span>}
                      {index > 2 && <span style={{ color: '#6b7280' }}>#{index + 1}</span>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{agent.agentName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{agent.agentEmail}</div>
                    </td>
                    <td>{agent.totalLeads}</td>
                    <td>{agent.contactedLeads}</td>
                    <td>{agent.viewingLeads}</td>
                    <td>{agent.negotiationLeads}</td>
                    <td>
                      <span className="status status-closed">{agent.closedDeals}</span>
                    </td>
                    <td>{agent.conversionRate}%</td>
                    <td style={{ fontWeight: 600 }}>{formatIDR(agent.totalCommission)}</td>
                  </tr>
                ))}
                {performance.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                      Tidak ada data agent
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div className="card">
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>Active Deals</h4>
            <p style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>{overview.activeDeals}</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Leads in Viewing/Negotiation</p>
          </div>
          <div className="card">
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>Avg Days to Close</h4>
            <p style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>{overview.avgDaysToClose}</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Average sales cycle length</p>
          </div>
          <div className="card">
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>New Leads This Period</h4>
            <p style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>{overview.newLeadsThisPeriod}</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Leads with status: New</p>
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
