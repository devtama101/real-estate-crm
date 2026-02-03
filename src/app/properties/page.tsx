'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { GoogleMap } from '@/components/google-map'
import { PROPERTY_STATUS, PROPERTY_TYPE, formatIDR, INDONESIAN_CITIES, SAMPLE_PROPERTY_IMAGES } from '@/lib/constants'
import { PropertyStatus, PropertyType } from '@prisma/client'
import { getProperties, createProperty as createPropertyAction, updatePropertyStatus } from '@/app/actions/properties'

const statusClassMap: Record<string, string> = {
  'AVAILABLE': 'status-available',
  'RESERVED': 'status-reserved',
  'SOLD': 'status-sold',
  'RENTED': 'status-rented',
  'OFF_MARKET': 'status-off_market',
}

const typeIcons: Record<string, string> = {
  'HOUSE': '🏠',
  'APARTMENT': '🏢',
  'TOWNHOUSE': '🏘️',
  'STUDIO': '🏢',
  'LAND': '🏞️',
  'COMMERCIAL': '🏪',
  'VILLA': '🏡',
}

const getPropertyTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'HOUSE': 'Rumah',
    'APARTMENT': 'Apartemen',
    'TOWNHOUSE': 'Townhouse',
    'STUDIO': 'Studio',
    'LAND': 'Tanah',
    'COMMERCIAL': 'Ruko',
    'VILLA': 'Villa',
  }
  return labels[type] || type
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

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  // Fetch properties
  const fetchProperties = async () => {
    setLoading(true)
    try {
      const filters: any = {}
      if (filterStatus !== 'all') filters.status = filterStatus as PropertyStatus
      if (filterType !== 'all') filters.type = filterType as PropertyType
      if (searchQuery) filters.search = searchQuery

      const data = await getProperties(filters)
      setProperties(data)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [filterStatus, filterType, searchQuery])

  const updateStatusHandler = async (id: string, newStatus: string) => {
    try {
      await updatePropertyStatus(id, newStatus as PropertyStatus)
      fetchProperties()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Handle amenities checkbox
    const amenities: string[] = []
    e.currentTarget.querySelectorAll('input[name="amenities"]:checked').forEach((checkbox) => {
      amenities.push((checkbox as HTMLInputElement).value)
    })
    formData.append('amenities', JSON.stringify(amenities))

    // Add default image
    formData.append('images', JSON.stringify([SAMPLE_PROPERTY_IMAGES[0]]))

    try {
      await createPropertyAction(formData)
      setShowAddModal(false)
      fetchProperties()
    } catch (error) {
      console.error('Failed to create property:', error)
    }
  }

  const filteredProperties = properties.filter((property) => {
    if (filterStatus !== 'all' && property.status !== filterStatus) return false
    if (filterType !== 'all' && property.propertyType !== filterType) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        property.title.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            <h1>Properti</h1>
            <p>Kelola listing dan inventaris properti Anda</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              + Tambah Properti
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Cari properti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              {Object.values(PROPERTY_STATUS).map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Semua Tipe</option>
              {Object.values(PROPERTY_TYPE).map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <button
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('grid')}
              >
                ⊞
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('list')}
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Google Map View */}
        {!loading && properties.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <GoogleMap properties={properties} height="350px" />
          </div>
        )}

        {/* Properties Grid/List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : viewMode === 'grid' ? (
          <div className="grid-3">
            {properties.map((property) => {
              const image = property.images?.[0] || SAMPLE_PROPERTY_IMAGES[0]
              const typeLabel = getPropertyTypeLabel(property.propertyType)
              const statusLabel = getStatusLabel(property.status)

              return (
                <div
                  key={property.id}
                  className="property-card"
                  onClick={() => window.location.href = `/properties/${property.id}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    className="property-image"
                    style={{
                      background: `url(${image}) center/cover`,
                    }}
                  >
                    <div className="property-badge">{statusLabel === 'Tersedia' ? 'Baru Listing' : statusLabel}</div>
                    <div className="property-price">{formatIDR(property.price)}</div>
                  </div>
                  <div className="property-content">
                    <div className="property-title">{property.title}</div>
                    <div className="property-address">
                      {typeIcons[property.propertyType] || '🏠'} {property.address}, {property.city}
                    </div>
                    <div className="property-specs">
                      <span className="property-spec">🛏️ {property.bedrooms} KT</span>
                      <span className="property-spec">🚿 {property.bathrooms} KM</span>
                      <span className="property-spec">📐 {property.size} m²</span>
                    </div>
                    {property.amenities && property.amenities.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {property.amenities.slice(0, 3).map((a: string, i: number) => (
                          <span key={i} className="badge">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Properti</th>
                  <th>Alamat</th>
                  <th>Tipe</th>
                  <th>Spesifikasi</th>
                  <th>Harga</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => {
                  const typeLabel = getPropertyTypeLabel(property.propertyType)
                  const statusLabel = getStatusLabel(property.status)

                  return (
                    <tr key={property.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{property.title}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{property.address}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                          {property.city}, {property.state}
                        </div>
                      </td>
                      <td>{typeLabel}</td>
                      <td>
                        {property.bedrooms > 0 && `${property.bedrooms} KT / `}
                        {property.bathrooms} KM
                        <br />
                        <span style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                          {property.size} m²
                        </span>
                      </td>
                      <td>{formatIDR(property.price)}</td>
                      <td>
                        <select
                          className={`status ${statusClassMap[property.status] || ''}`}
                          style={{ border: 'none', cursor: 'pointer', fontWeight: 500 }}
                          value={property.status}
                          onChange={(e) => updateStatusHandler(property.id, e.target.value)}
                        >
                          {Object.values(PROPERTY_STATUS).map((status) => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a
                            href={`/properties/${property.id}`}
                            className="btn btn-sm btn-secondary"
                          >
                            Lihat
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && properties.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray-600)' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏘️</p>
            <p>Tidak ada properti ditemukan</p>
          </div>
        )}
      </main>

      {/* Add Property Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="card"
            style={{ width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <h2 className="card-title">Tambah Properti Baru</h2>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Judul Properti *</label>
                <input type="text" name="title" className="form-control" required placeholder="Contoh: Rumah Modern Minimalis" />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Alamat Jalan *</label>
                  <input type="text" name="address" className="form-control" required placeholder="Jl. Sudirman No. 123" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Kota *</label>
                  <select name="city" className="form-control" required>
                    <option value="">Pilih Kota...</option>
                    {INDONESIAN_CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Provinsi *</label>
                  <select name="state" className="form-control" required>
                    <option value="">Pilih Provinsi...</option>
                    <option value="DKI Jakarta">DKI Jakarta</option>
                    <option value="Jawa Barat">Jawa Barat</option>
                    <option value="Jawa Tengah">Jawa Tengah</option>
                    <option value="Jawa Timur">Jawa Timur</option>
                    <option value="Banten">Banten</option>
                    <option value="Bali">Bali</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Kode Pos *</label>
                  <input type="text" name="zipCode" className="form-control" required placeholder="12345" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Tipe Properti *</label>
                  <select name="propertyType" className="form-control" required>
                    <option value="HOUSE">Rumah</option>
                    <option value="APARTMENT">Apartemen</option>
                    <option value="STUDIO">Studio</option>
                    <option value="TOWNHOUSE">Townhouse</option>
                    <option value="VILLA">Villa</option>
                    <option value="COMMERCIAL">Ruko</option>
                    <option value="LAND">Tanah</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Harga (Rp) *</label>
                  <input type="number" name="price" className="form-control" required placeholder="1500000000" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Kamar Tidur *</label>
                  <input type="number" name="bedrooms" className="form-control" required min="0" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Kamar Mandi *</label>
                  <input type="number" name="bathrooms" className="form-control" required min="0" step="0.5" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Luas (m²) *</label>
                  <input type="number" name="size" className="form-control" required min="0" />
                </div>
              </div>
              <div className="form-group">
                <label>Deskripsi</label>
                <textarea name="description" className="form-control" rows={3} placeholder="Jelaskan properti..." />
              </div>
              <div className="form-group">
                <label>Fasilitas</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Kolam Renang', 'Garasi', 'Carport', 'Taman', 'AC', 'Balkon', 'Gym', 'Keamanan 24 Jam'].map((amenity) => (
                    <label key={amenity} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                      <input type="checkbox" name="amenities" value={amenity} />
                      {amenity}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">Simpan Properti</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
