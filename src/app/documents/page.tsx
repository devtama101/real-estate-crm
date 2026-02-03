'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { DocumentType, DocumentStatus } from '@prisma/client'
import { getDocuments, createDocument as createDocumentAction, sendForSignature } from '@/app/actions/documents'

const typeIcons: Record<string, string> = {
  [DocumentType.CONTRACT]: '📄',
  [DocumentType.DISCLOSURE]: '📋',
  [DocumentType.INSPECTION_REPORT]: '🔍',
  [DocumentType.APPRAISAL]: '📊',
  [DocumentType.OFFER_LETTER]: '✉️',
  [DocumentType.LOI]: '📝',
  [DocumentType.OTHER]: '📁',
}

const statusClassMap: Record<string, string> = {
  [DocumentStatus.DRAFT]: 'status-new',
  [DocumentStatus.SENT]: 'status-viewing',
  [DocumentStatus.SIGNED]: 'status-closed',
  [DocumentStatus.EXPIRED]: 'status-lost',
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'DRAFT': 'Draft',
    'SENT': 'Terkirim',
    'SIGNED': 'Signed',
    'EXPIRED': 'Expired',
  }
  return labels[status] || status
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Fetch documents
  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const filters: any = {}
      if (filterType !== 'all') filters.type = filterType as DocumentType
      if (filterStatus !== 'all') filters.status = filterStatus as DocumentStatus

      const data = await getDocuments(filters)
      setDocuments(data)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [filterType, filterStatus])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const fileInput = formData.get('file') as File

    if (!fileInput || fileInput.size === 0) {
      alert('Please select a file')
      return
    }

    try {
      // Mock file upload - in production, upload to storage service
      const mockUrl = `/documents/${fileInput.name}`

      await createDocumentAction({
        name: formData.get('name') as string,
        fileName: fileInput.name,
        fileSize: fileInput.size,
        mimeType: fileInput.type,
        url: mockUrl,
        type: formData.get('type') as DocumentType,
        category: formData.get('category') as string,
      })

      setShowUploadModal(false)
      fetchDocuments()
    } catch (error) {
      console.error('Failed to upload document:', error)
    }
  }

  const handleSendForSignature = async (documentId: string) => {
    try {
      await sendForSignature(documentId, 'signer@example.com', 'John Doe')
      fetchDocuments()
    } catch (error) {
      console.error('Failed to send for signature:', error)
    }
  }

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            <h1>Dokumen</h1>
            <p>Kelola kontrak, disclosure, dan perjanjian</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowUploadModal(true)}
            >
              + Upload Dokumen
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
                placeholder="Cari dokumen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Semua Tipe</option>
              <option value={DocumentType.CONTRACT}>Kontrak</option>
              <option value={DocumentType.DISCLOSURE}>Disclosure</option>
              <option value={DocumentType.INSPECTION_REPORT}>Laporan Inspeksi</option>
              <option value={DocumentType.APPRAISAL}>Appraisal</option>
              <option value={DocumentType.OFFER_LETTER}>Surat Penawaran</option>
              <option value={DocumentType.LOI}>LOI</option>
            </select>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value={DocumentStatus.DRAFT}>Draft</option>
              <option value={DocumentStatus.SENT}>Terkirim</option>
              <option value={DocumentStatus.SIGNED}>Signed</option>
              <option value={DocumentStatus.EXPIRED}>Expired</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div className="stat-content">
              <h3>{documents.length}</h3>
              <p>Total Dokumen</p>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div className="stat-content">
              <h3>{documents.filter((d) => d.status === DocumentStatus.SIGNED).length}</h3>
              <p>Terdetikasi</p>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div className="stat-content">
              <h3>{documents.filter((d) => d.status === DocumentStatus.SENT).length}</h3>
              <p>Menunggu Tanda Tangan</p>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div className="stat-content">
              <h3>{documents.filter((d) => d.esignProvider === 'DocuSign').length}</h3>
              <p>Permintaan E-Signature</p>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray-600)' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>📁</p>
              <p>Tidak ada dokumen ditemukan</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Dokumen</th>
                  <th>Tipe</th>
                  <th>Terkait Dengan</th>
                  <th>Ukuran</th>
                  <th>Status</th>
                  <th>E-Signature</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{typeIcons[doc.type] || '📁'}</span>
                        <div>
                          <div style={{ fontWeight: 500 }}>{doc.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{doc.category || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge">{doc.type.replace('_', ' ')}</span>
                    </td>
                    <td>
                      {doc.lead && (
                        <div style={{ fontSize: '13px' }}>Lead: {doc.lead.name}</div>
                      )}
                      {doc.property && (
                        <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                          {doc.property.title}
                        </div>
                      )}
                      {!doc.lead && !doc.property && (
                        <div style={{ fontSize: '13px', color: 'var(--gray-600)' }}>-</div>
                      )}
                    </td>
                    <td>{formatFileSize(doc.fileSize)}</td>
                    <td>
                      <span className={`status ${statusClassMap[doc.status as DocumentStatus] || ''}`}>
                        {getStatusLabel(doc.status)}
                      </span>
                    </td>
                    <td>
                      {doc.esignProvider ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="badge">{doc.esignProvider}</span>
                          <span
                            className={`status ${doc.esignStatus === 'SIGNED' ? 'status-closed' : doc.esignStatus === 'PENDING' ? 'status-viewing' : 'status-new'}`}
                          >
                            {doc.esignStatus}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {doc.status === DocumentStatus.DRAFT && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleSendForSignature(doc.id)}
                          >
                            Kirim untuk TTD
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
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
            onClick={() => setShowUploadModal(false)}
          >
            <div
              className="card"
              style={{ width: '500px', maxWidth: '90vw' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-header">
                <h2 className="card-title">Upload Dokumen</h2>
                <button onClick={() => setShowUploadModal(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nama Dokumen *</label>
                  <input type="text" name="name" className="form-control" required placeholder="Contoh: Perjanjian Jual Beli" />
                </div>
                <div className="form-group">
                  <label>File *</label>
                  <input
                    type="file"
                    className="form-control"
                    required
                    accept=".pdf,.doc,.docx"
                  />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Tipe</label>
                    <select name="type" className="form-control" required>
                      <option value={DocumentType.CONTRACT}>Kontrak</option>
                      <option value={DocumentType.DISCLOSURE}>Disclosure</option>
                      <option value={DocumentType.INSPECTION_REPORT}>Laporan Inspeksi</option>
              <option value={DocumentType.APPRAISAL}>Appraisal</option>
                      <option value={DocumentType.OFFER_LETTER}>Surat Penawaran</option>
                      <option value={DocumentType.LOI}>LOI</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Kategori</label>
                    <input type="text" name="category" className="form-control" placeholder="Contoh: Jual Beli" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Hubungkan Dengan</label>
                  <select name="relatedTo" className="form-control">
                    <option value="">None</option>
                    <option value="lead-1">Lead: Budi Santoso</option>
                    <option value="property-1">Properti: Rumah Modern Minimalis</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary">Upload Dokumen</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
