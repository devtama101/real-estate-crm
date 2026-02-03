import { Sidebar } from '@/components/sidebar'
import { getLeads } from '@/app/actions/leads'
import { getProperties } from '@/app/actions/properties'
import { getAppointments } from '@/app/actions/appointments'
import { formatIDR, LEAD_STATUS, PROPERTY_STATUS } from '@/lib/constants'

async function getDashboardData() {
  const [leads, properties, appointments] = await Promise.all([
    getLeads(),
    getProperties(),
    getAppointments(),
  ])

  const activeLeadsCount = leads.filter((l: any) => l.status === 'NEW').length
  const viewingLeadsCount = leads.filter((l: any) => l.status === 'VIEWING' || l.status === 'NEGOTIATION').length
  const closedThisMonthCount = leads.filter((l: any) => l.status === 'CLOSED').length
  const pendingCommission = properties
    .filter((p: any) => p.status === 'SOLD')
    .reduce((sum: number, p: any) => sum + Number(p.price || 0) * 0.03, 0)

  const recentLeads = leads.slice(0, 4)

  const featuredProperties = properties.slice(0, 3).map((p: any) => ({
    id: p.id,
    title: p.title,
    address: `${p.address}, ${p.city}`,
    badge: 'Baru Listing',
    price: formatIDR(p.price || 0),
    beds: p.bedrooms || 0,
    baths: p.bathrooms || 0,
    size: `${p.size || 0} m²`,
    image: p.images?.[0] || '',
  }))

  const todayAppointments = appointments.slice(0, 3).map((apt: any) => ({
    time: new Date(apt.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    period: new Date(apt.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })?.includes('PM') ? 'PM' : 'AM',
    title: 'Survei Properti',
    location: apt.property?.address || 'TBD',
    client: apt.lead?.name || 'TBD',
  }))

  const pipelineStages = [
    { stage: 'Baru', count: leads.filter((l: any) => l.status === 'NEW').length, percentage: 35, color: '#3b82f6' },
    { stage: 'Dihubungi', count: leads.filter((l: any) => l.status === 'CONTACTED').length, percentage: 25, color: '#8b5cf6' },
    { stage: 'Survei', count: leads.filter((l: any) => l.status === 'VIEWING').length, percentage: 20, color: '#f59e0b' },
    { stage: 'Negosiasi', count: leads.filter((l: any) => l.status === 'NEGOTIATION').length, percentage: 15, color: '#ec4899' },
    { stage: 'Closing', count: leads.filter((l: any) => l.status === 'CLOSED').length, percentage: 18, color: '#10b981' },
  ]

  return {
    stats: [
      { label: 'Lead Aktif', value: String(leads.length), icon: '👥', color: 'blue' },
      { label: 'Listing Aktif', value: String(properties.length), icon: '🏘️', color: 'green' },
      { label: 'Minggu Ini', value: String(appointments.length), icon: '📅', color: 'orange' },
      { label: 'Komisi Pending', value: formatIDR(pendingCommission), icon: '💰', color: 'purple' },
    ],
    pipelineData: pipelineStages,
    appointments: todayAppointments,
    recentLeads,
    featuredProperties,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  const statusClassMap: Record<string, string> = {
    'NEW': 'status-new',
    'CONTACTED': 'status-contacted',
    'VIEWING': 'status-viewing',
    'NEGOTIATION': 'status-negotiation',
    'CLOSED': 'status-closed',
    'LOST': 'status-lost',
  }

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            <h1>Selamat Datang, Andi!</h1>
            <p>Anda punya {data.stats[0].value} lead baru dan {data.stats[2].value} janji temu hari ini</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary">+ Properti Baru</button>
            <button className="btn btn-primary">+ Tambah Lead</button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          {data.stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          {/* Pipeline Overview */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Pipeline Overview</h2>
              <a href="/pipeline" className="link">Lihat Semua →</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.pipelineData.map((item) => (
                <div key={item.stage} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '120px', fontSize: '13px', color: 'var(--gray-600)' }}>{item.stage}</div>
                  <div style={{ flex: 1, height: '24px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${item.percentage}%`,
                        height: '100%',
                        background: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '11px',
                      }}
                    >
                      {item.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Appointments */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Janji Temu Hari Ini</h2>
              <a href="/calendar" className="link">Lihat Kalender →</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.appointments.map((apt, i) => (
                <div
                  key={`${apt.time}-${apt.period}-${i}`}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--gray-100)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ textAlign: 'center', minWidth: '50px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--primary)' }}>{apt.time}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-600)' }}>{apt.period}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{apt.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{apt.location} • {apt.client}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Leads */}
        <h2 style={{ margin: '30px 0 16px' }}>Lead Terbaru</h2>
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
              {data.recentLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{lead.name}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{lead.email || '-'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{lead.phone || '-'}</div>
                  </td>
                  <td>{lead.propertyType || '-'}</td>
                  <td>{lead.budgetDisplay || '-'}</td>
                  <td>{lead.source || '-'}</td>
                  <td>
                    <span className={`status ${statusClassMap[lead.status] || ''}`}>
                      {LEAD_STATUS[lead.status as keyof typeof LEAD_STATUS]?.label || lead.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Featured Listings */}
        <h2 style={{ margin: '30px 0 16px' }}>Listing Unggulan</h2>
        <div className="grid-3">
          {data.featuredProperties.map((property) => (
            <div key={property.id} className="property-card">
              <div
                className="property-image"
                style={{
                  background: property.image ? `url(${property.image}) center/cover` : 'linear-gradient(135deg, var(--primary), #3b82f6)',
                }}
              >
                <div className="property-badge">{property.badge}</div>
                <div className="property-price">{property.price}</div>
              </div>
              <div className="property-content">
                <div className="property-title">{property.title}</div>
                <div className="property-address">{property.address}</div>
                <div className="property-specs">
                  <span className="property-spec">🛏️ {property.beds} KT</span>
                  <span className="property-spec">🚿 {property.baths} KM</span>
                  <span className="property-spec">📐 {property.size}</span>
                </div>
              </div>
            </div>
 ))}
        </div>
      </main>
    </div>
  )
}
