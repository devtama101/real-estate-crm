'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { CommissionStatus } from '@prisma/client'
import { formatIDR } from '@/lib/constants'
import { getCommissions, getCommissionSummary, getMonthlyCommissions } from '@/app/actions/commissions'

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([])
  const [summary, setSummary] = useState({ pending: 0, approved: 0, paid: 0, total: 0, closedDeals: 0 })
  const [monthlyData, setMonthlyData] = useState<{ month: string, amount: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Fetch commissions
  const fetchCommissions = async () => {
    setLoading(true)
    try {
      const filters: any = {}
      if (filterStatus !== 'all') filters.status = filterStatus as CommissionStatus

      const [commissionsData, summaryData, monthlyDataRaw] = await Promise.all([
        getCommissions(filters),
        getCommissionSummary(),
        getMonthlyCommissions(),
      ])

      setCommissions(commissionsData)
      setSummary(summaryData)

      // Format monthly data with Indonesian month names
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      setMonthlyData(monthlyDataRaw.map((d, i) => ({
        month: monthNames[i],
        amount: d.amount,
      })))
    } catch (error) {
      console.error('Failed to fetch commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommissions()
  }, [filterStatus])

  const updateStatusHandler = async (id: string, newStatus: string) => {
    // This would call updateCommissionStatus if needed
    console.log('Update commission status:', id, newStatus)
    fetchCommissions()
  }

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            <h1>Komisi</h1>
            <p>Lacak penghasilan dan pembayaran deal</p>
          </div>
        </header>

        {/* Summary Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon orange">💰</div>
            <div className="stat-content">
              <h3>{formatIDR(summary.pending)}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">✓</div>
            <div className="stat-content">
              <h3>{formatIDR(summary.approved)}</h3>
              <p>Disetujui</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">💵</div>
            <div className="stat-content">
              <h3>{formatIDR(summary.paid)}</h3>
              <p>Dibayar (Tahun Ini)</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">📈</div>
            <div className="stat-content">
              <h3>{formatIDR(summary.total)}</h3>
              <p>Total Earned</p>
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Monthly Chart */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '20px' }}>Penghasilan Bulanan</h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '150px' }}>
              {monthlyData.map((data, i) => {
                const maxAmount = Math.max(...monthlyData.map((d) => d.amount))
                const height = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0
                return (
                  <div key={data.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${height}%`,
                        background: data.amount > 0 ? 'var(--primary)' : 'var(--gray-200)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: '4px',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--gray-600)', marginTop: '4px' }}>{data.month}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Deals */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '20px' }}>Deal Terbaik Bulan Ini</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {commissions.slice(0, 3).map((comm) => (
                <div
                  key={comm.id}
                  style={{
                    padding: '12px',
                    background: 'var(--gray-100)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{comm.property.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                      {formatIDR(comm.dealValue)} • {(comm.commissionRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--success)' }}>
                    {formatIDR(comm.commissionAmount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Commissions Table */}
        <div className="table-container">
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Semua Komisi</h3>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value={CommissionStatus.PENDING}>Pending</option>
              <option value={CommissionStatus.APPROVED}>Disetujui</option>
              <option value={CommissionStatus.PAID}>Dibayar</option>
            </select>
          </div>
          <table>
            <thead>
              <tr>
                <th>Properti</th>
                <th>Nilai Deal</th>
                <th>Rate</th>
                <th>Komisi</th>
                <th>Split</th>
                <th>Status</th>
                <th>Tanggal Bayar</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((comm) => (
                <tr key={comm.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{comm.property.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{comm.property.address}</div>
                  </td>
                  <td>{formatIDR(comm.dealValue)}</td>
                  <td>{(comm.commissionRate * 100).toFixed(2)}%</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{formatIDR(comm.commissionAmount)}</span>
                  </td>
                  <td>
                    {comm.splitPercentage ? (
                      <span style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                        {comm.splitPercentage}% ({formatIDR(comm.splitAmount || 0)})
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span className={`status status-${comm.status.toLowerCase()}`}>
                      {comm.status === 'PENDING' ? 'Pending' : comm.status === 'APPROVED' ? 'Disetujui' : 'Dibayar'}
                    </span>
                  </td>
                  <td>
                    {comm.paidDate ? comm.paidDate.toLocaleDateString('id-ID') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
