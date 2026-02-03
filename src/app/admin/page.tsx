import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/sidebar'
import Link from 'next/link'

async function getAdminData() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Get all users with their stats
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Get stats for each user
  const usersWithStats = await Promise.all(
    users.map(async (usr) => {
      const [leadsCount, activeDeals, closedDeals] = await Promise.all([
        prisma.lead.count({ where: { assignedToId: usr.id } }),
        prisma.lead.count({ where: { assignedToId: usr.id, status: { in: ['NEGOTIATION', 'VIEWING'] } } }),
        prisma.lead.count({ where: { assignedToId: usr.id, status: 'CLOSED' } }),
      ])

      const totalCommission = await prisma.commission.aggregate({
        where: { agentId: usr.id, status: 'PAID' },
        _sum: { paidAmount: true },
      })

      return {
        ...usr,
        leadsCount,
        activeDeals,
        closedDeals,
        totalCommission: totalCommission._sum.paidAmount || BigInt(0),
      }
    })
  )

  // Overall stats
  const [totalUsers, totalLeads, totalProperties, activeDeals, monthlyRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.lead.count(),
    prisma.property.count(),
    prisma.lead.count({ where: { status: { in: ['NEGOTIATION', 'VIEWING'] } } }),
    prisma.commission.aggregate({
      where: { status: 'PAID', createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      _sum: { paidAmount: true },
    }),
  ])

  // Recent activity across all users
  const recentActivities = await prisma.activity.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      lead: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  })

  return {
    users: usersWithStats,
    recentActivities,
    stats: {
      totalUsers,
      totalLeads,
      totalProperties,
      activeDeals,
      monthlyRevenue: monthlyRevenue._sum.paidAmount || BigInt(0),
    },
  }
}

function formatIDR(amount: number | bigint) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

export default async function AdminDashboard() {
  const data = await getAdminData()

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h1>Admin Dashboard</h1>
            <p>Manage users and monitor team performance</p>
          </div>
          <div className="header-actions">
            <Link href="/settings/users" className="btn btn-primary">
              + Tambah User
            </Link>
          </div>
        </header>

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{data.stats.totalUsers}</h3>
              <p>Total Agents</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{data.stats.totalLeads}</h3>
              <p>Total Leads</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏠</div>
            <div className="stat-content">
              <h3>{data.stats.totalProperties}</h3>
              <p>Total Properties</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>{formatIDR(data.stats.monthlyRevenue)}</h3>
              <p>Pendapatan Bulan Ini</p>
            </div>
          </div>
        </div>

        {/* Team Performance */}
        <h2 style={{ margin: '30px 0 16px' }}>Team Performance</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Email</th>
                <th>Role</th>
                <th>Leads</th>
                <th>Active Deals</th>
                <th>Closed</th>
                <th>Total Komisi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((usr) => (
                <tr key={usr.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{usr.name}</div>
                  </td>
                  <td style={{ fontSize: '13px' }}>{usr.email}</td>
                  <td>
                    <span className={`status ${usr.role === 'ADMIN' ? 'status-closed' : 'status-new'}`}>
                      {usr.role}
                    </span>
                  </td>
                  <td>{usr.leadsCount}</td>
                  <td>{usr.activeDeals}</td>
                  <td>{usr.closedDeals}</td>
                  <td>{formatIDR(usr.totalCommission)}</td>
                  <td>
                    <Link
                      href={`/settings/users/${usr.id}`}
                      className="btn btn-sm btn-secondary"
                      style={{ marginRight: '4px' }}
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/settings/users/${usr.id}/delete`}
                      className="btn btn-sm"
                      style={{
                        padding: '6px 12px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    >
                      Hapus
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <h2 style={{ margin: '30px 0 16px' }}>Aktivitas Terbaru</h2>
        <div className="card">
          {data.recentActivities.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
              Belum ada aktivitas
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    padding: '12px 16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      {activity.type} - {activity.lead?.name || 'N/A'}
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                      {activity.createdBy?.name} • {new Date(activity.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <span className={`badge ${activity.type === 'CALL' ? 'badge-viewing' : 'badge-negotiation'}`}>
                    {activity.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
