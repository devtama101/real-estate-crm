import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Sidebar } from '@/components/sidebar'
import { LogoutButton } from '@/components/logout-button'
import './dashboard.css'

async function getDashboardData() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const [properties, leads, appointments, commissions] = await Promise.all([
    prisma.property.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.lead.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.appointment.findMany({
      take: 5,
      where: { startTime: { gte: new Date() } },
      orderBy: { startTime: 'asc' },
      include: { lead: true, property: true },
    }),
    prisma.commission.findMany({
      take: 5,
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: { property: true },
    }),
  ])

  const stats = {
    totalProperties: await prisma.property.count(),
    totalLeads: await prisma.lead.count(),
    upcomingAppointments: await prisma.appointment.count({
      where: { startTime: { gte: new Date() }, status: 'SCHEDULED' },
    }),
    pendingCommissions: await prisma.commission.count({ where: { status: 'PENDING' } }),
  }

  return { user: session.user, stats, properties, leads, appointments, commissions }
}

function formatIDR(amount: number | bigint) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(amount))
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            <h1>Dashboard</h1>
            <p>Selamat datang kembali, {data.user.name}!</p>
          </div>
          <div className="header-actions">
            <Link href="/properties/new" className="btn btn-secondary">+ Properti Baru</Link>
            <Link href="/leads/new" className="btn btn-primary">+ Tambah Lead</Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">🏠</div>
            <div className="stat-content">
              <h3>{data.stats.totalProperties}</h3>
              <p>Total Properti</p>
            </div>
            <Link href="/properties" className="stat-link">Lihat →</Link>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{data.stats.totalLeads}</h3>
              <p>Total Leads</p>
            </div>
            <Link href="/leads" className="stat-link">Lihat →</Link>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{data.stats.upcomingAppointments}</h3>
              <p>Janji Temu</p>
            </div>
            <Link href="/appointments" className="stat-link">Lihat →</Link>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>{data.stats.pendingCommissions}</h3>
              <p>Komisi Pending</p>
            </div>
            <Link href="/commissions" className="stat-link">Lihat →</Link>
          </div>
        </div>

        <div className="grid-2">
          {/* Upcoming Appointments */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Janji Temu Mendatang</h2>
              <Link href="/appointments" className="link">Lihat Semua →</Link>
            </div>
            {data.appointments.length === 0 ? (
              <p className="empty-state">Tidak ada janji temu mendatang</p>
            ) : (
              <div className="appointment-list">
                {data.appointments.map((apt) => (
                  <div key={apt.id} className="appointment-item">
                    <div className="appointment-time">
                      <div className="time-day">
                        {new Date(apt.startTime).toLocaleDateString('id-ID', { day: 'numeric' })}
                      </div>
                      <div className="time-month">
                        {new Date(apt.startTime).toLocaleDateString('id-ID', { month: 'short' })}
                      </div>
                    </div>
                    <div className="appointment-info">
                      <h4>{apt.title}</h4>
                      <p>{apt.lead?.name || 'TBD'} • {apt.property?.title || 'TBD'}</p>
                    </div>
                    <span className={`badge badge-${apt.type.toLowerCase()}`}>
                      {apt.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Commissions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Komisi Pending</h2>
              <Link href="/commissions" className="link">Lihat Semua →</Link>
            </div>
            {data.commissions.length === 0 ? (
              <p className="empty-state">Tidak ada komisi pending</p>
            ) : (
              <div className="commission-list">
                {data.commissions.map((comm) => (
                  <div key={comm.id} className="commission-item">
                    <div className="commission-icon">💰</div>
                    <div className="commission-info">
                      <h4>{comm.property.title}</h4>
                      <p>{formatIDR(comm.commissionAmount)}</p>
                    </div>
                    <span className={`badge badge-${comm.status.toLowerCase()}`}>
                      {comm.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <h2 className="section-title">Lead Terbaru</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kontak</th>
                <th>Minat</th>
                <th>Budget</th>
                <th>Sumber</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className="user-name">
                      <span className="avatar">{lead.name.charAt(0)}</span>
                      {lead.name}
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">{lead.email || '-'}</div>
                    <div className="contact-secondary">{lead.phone || '-'}</div>
                  </td>
                  <td>{lead.propertyType || '-'}</td>
                  <td>{lead.budgetMin ? formatIDR(lead.budgetMin) : '-'}</td>
                  <td>{lead.source || '-'}</td>
                  <td>
                    <span className={`status status-${lead.status.toLowerCase()}`}>
                      {lead.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Properties */}
        <h2 className="section-title">Properti Terbaru</h2>
        <div className="grid-3">
          {data.properties.map((property) => (
            <Link key={property.id} href={`/properties/${property.id}`} className="property-card-link">
              <div className="property-card">
                <div
                  className="property-image"
                  style={{
                    background: property.images?.[0]
                      ? `url(${property.images[0]}) center/cover`
                      : 'linear-gradient(135deg, var(--primary), #3b82f6)',
                  }}
                >
                  <span className={`property-badge badge-${property.status.toLowerCase()}`}>
                    {property.status}
                  </span>
                  <div className="property-price">{formatIDR(property.price)}</div>
                </div>
                <div className="property-content">
                  <h3 className="property-title">{property.title}</h3>
                  <p className="property-address">{property.address}, {property.city}</p>
                  <div className="property-specs">
                    <span className="property-spec">🛏️ {property.bedrooms || 0} KT</span>
                    <span className="property-spec">🚿 {property.bathrooms || 0} KM</span>
                    <span className="property-spec">📐 {property.size || 0} m²</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
