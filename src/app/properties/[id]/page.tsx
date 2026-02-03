'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/sidebar'
import { PropertyStatus, PropertyType } from '@prisma/client'
import { PROPERTY_STATUS, PROPERTY_TYPE, formatIDR } from '@/lib/constants'
import { getProperty, updatePropertyStatus } from '@/app/actions/properties'

const statusClassMap: Record<string, string> = {
  'AVAILABLE': 'status-available',
  'RESERVED': 'status-reserved',
  'SOLD': 'status-sold',
  'RENTED': 'status-rented',
  'OFF_MARKET': 'status-off_market',
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'AVAILABLE': 'Tersedia',
    'RESERVED': 'Booked',
    'SOLD': 'Terjual',
    'RENTED': 'Disewa',
    'OFF_MARKET': 'Off Market',
  }
  return labels[status] || status
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'HOUSE': 'Rumah',
    'APARTMENT': 'Apartemen',
    'TOWNHOUSE': 'Townhouse',
    'STUDIO': 'Studio',
    'VILLA': 'Villa',
    'COMMERCIAL': 'Ruko',
    'LAND': 'Tanah',
  }
  return labels[type] || type
}

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string

  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProperty()
  }, [propertyId])

  const fetchProperty = async () => {
    try {
      const data = await getProperty(propertyId)
      setProperty(data)
    } catch (error) {
      console.error('Failed to fetch property:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updatePropertyStatus(propertyId, newStatus as PropertyStatus)
      fetchProperty()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Properti: ${property.title}`)
    const body = encodeURIComponent(`Halo,\n\nSaya ingin membagikan informasi properti ini kepada Anda:\n\n${property.title}\n${property.address}, ${property.city}\n\nHarga: ${formatIDR(property.price)}\n\nLink: ${window.location.href}\n\nSalam,`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link properti berhasil disalin!')
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        </main>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Properti tidak ditemukan</p>
            <Link href="/properties" className="btn btn-primary">Kembali ke Daftar Properti</Link>
          </div>
        </main>
      </div>
    )
  }

  const images = property.images || []
  const featuredImage = images[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <header className="header" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/properties" className="btn btn-secondary btn-sm">← Kembali</Link>
            <div className="header-title">
              <h1>{property.title}</h1>
              <p>Detail properti lengkap</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={handlePrint}>
              📄 Cetak Brosur
            </button>
          </div>
        </header>

        {/* Image Gallery */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: images.length > 1 ? '2fr 1fr' : '1fr',
            gap: '16px',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div
              style={{
                height: '400px',
                background: `url(${featuredImage}) center/cover`,
                borderRadius: images.length > 1 ? '12px 0 0 12px' : '12px',
              }}
            />
            {images.length > 1 && (
              <div style={{
                display: 'grid',
                gridTemplateRows: '1fr 1fr',
                gap: '8px',
              }}>
                <div
                  style={{
                    height: '100%',
                    background: `url(${images[1] || featuredImage}) center/cover`,
                    borderRadius: '0 12px 0 0',
                  }}
                />
                <div
                  style={{
                    height: '100%',
                    background: `url(${images[2] || featuredImage}) center/cover`,
                    borderRadius: '0 0 12px 0',
                  }}
                />
              </div>
            )}
          </div>
          {images.length > 3 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              {images.slice(3).map((img: string, i: number) => (
                <div
                  key={i}
                  style={{
                    width: '80px',
                    height: '80px',
                    background: `url(${img}) center/cover`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
          {/* Property Details */}
          <div>
            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>{formatIDR(property.price)}</h2>
                  <p style={{ color: 'var(--gray-600)' }}>
                    {property.address}, {property.city}, {property.state}
                  </p>
                </div>
                <select
                  className={`status ${statusClassMap[property.status] || ''}`}
                  style={{ border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  value={property.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  {Object.values(PROPERTY_STATUS).map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              {/* Specs */}
              <div style={{
                display: 'flex',
                gap: '24px',
                padding: '16px',
                background: 'var(--gray-100)',
                borderRadius: '12px',
                marginBottom: '20px',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600 }}>{property.bedrooms || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>Kamar Tidur</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600 }}>{property.bathrooms || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>Kamar Mandi</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600 }}>{property.size || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>m²</div>
                </div>
                {property.lotSize && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 600 }}>{property.lotSize}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>m² Tanah</div>
                  </div>
                )}
              </div>

              {/* Type & Details */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                  <span className="badge">{getTypeLabel(property.propertyType)}</span>
                  {property.yearBuilt && (
                    <span className="badge">Dibangun {property.yearBuilt}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              {property.description && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '8px' }}>Deskripsi</h3>
                  <p style={{ lineHeight: '1.6', color: 'var(--gray-700)' }}>{property.description}</p>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '12px' }}>Fasilitas</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {property.amenities.map((amenity: string, i: number) => (
                      <span key={i} className="badge" style={{
                        background: 'var(--gray-200)',
                        color: 'var(--gray-700)',
                      }}>
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <h3 style={{ marginBottom: '12px' }}>Lokasi</h3>
                <div style={{
                  padding: '16px',
                  background: 'var(--gray-100)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <span style={{ fontSize: '24px' }}>📍</span>
                  <div>
                    <div style={{ fontWeight: 500 }}>{property.address}</div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                      {property.city}, {property.state} {property.zipCode}
                    </div>
                  </div>
                </div>
                {property.latitude && property.longitude && (
                  <div style={{
                    marginTop: '12px',
                    height: '200px',
                    background: 'var(--gray-200)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gray-600)',
                  }}>
                    🗺️ Peta Lokasi (Google Maps)
                  </div>
                )}
              </div>
            </div>

            {/* Related Leads */}
            <div className="card">
              <h2 className="card-title" style={{ marginBottom: '16px' }}>Lead Terkait</h2>
              <p style={{ color: 'var(--gray-600)', textAlign: 'center', padding: '20px' }}>
                Tidak ada lead yang terhubung dengan properti ini
              </p>
            </div>
          </div>

          {/* Sidebar Info */}
          <div>
            {/* Listing Info */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>Informasi Listing</h3>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-600)' }}>ID Listing</span>
                  <span>{property.mlsId || property.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Terverifikasi</span>
                  <span style={{ color: 'var(--success)' }}>✓ Aktif</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Tanggal Listing</span>
                  <span>{new Date(property.listedDate).toLocaleDateString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Didaftarkan oleh</span>
                  <span>{property.listedBy?.name || 'Admin'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>Aksi Cepat</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={handleShareEmail}
                >
                  📧 Bagikan via Email
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={handleCopyLink}
                >
                  🔗 Copy Link Properti
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={handlePrint}
                >
                  📄 Cetak Brosur
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
