'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'

// Mock template email - Indonesian context
const mockTemplates = [
  {
    id: '1',
    name: 'Follow Up Lead Baru',
    category: 'FOLLOW_UP',
    subject: 'Terima kasih atas ketertarikan Anda!',
    variables: ['namaDepan', 'namaAgen'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Alert Properti - Listing Baru',
    category: 'PROPERTY_ALERT',
    subject: 'Properti baru yang cocok dengan kriteria Anda!',
    variables: ['namaDepan', 'namaProperti', 'alamatProperti', 'hargaProperti'],
    isActive: true,
  },
  {
    id: '3',
    name: 'Konfirmasi Survei',
    category: 'VIEWING_CONFIRMATION',
    subject: 'Survei Properti Dikonfirmasi',
    variables: ['namaDepan', 'alamatProperti', 'tanggalSurvei', 'jamSurvei'],
    isActive: true,
  },
  {
    id: '4',
    name: 'Pengingat Survei (24 jam)',
    category: 'VIEWING_REMINDER',
    subject: 'Pengingat: Survei Properti Besok',
    variables: ['namaDepan', 'alamatProperti', 'tanggalSurvei', 'jamSurvei'],
    isActive: true,
  },
  {
    id: '5',
    name: 'Selamat Offer Diterima',
    category: 'THANK_YOU',
    subject: 'Selamat! Offer Anda diterima!',
    variables: ['namaDepan', 'alamatProperti', 'jumlahOffer'],
    isActive: true,
  },
  {
    id: '6',
    name: 'Re-engagement - 30 hari tidak ada kontak',
    category: 'REENGAGEMENT',
    subject: 'Masih mencari properti impian?',
    variables: ['namaDepan', 'namaAgen', 'noHpAgen'],
    isActive: true,
  },
]

// Mock log email
const mockEmailLogs = [
  {
    id: '1',
    to: 'budi.santoso@email.com',
    subject: 'Survei Properti Dikonfirmasi',
    templateId: '3',
    status: 'SENT',
    sentAt: new Date('2024-01-15T10:30:00'),
  },
  {
    id: '2',
    to: 'siti.raahayu@email.com',
    subject: 'Alert Properti Baru - Apartemen Jakarta Selatan',
    templateId: '2',
    status: 'DELIVERED',
    sentAt: new Date('2024-01-15T09:15:00'),
  },
  {
    id: '3',
    to: 'agus.wijaya@email.com',
    subject: 'Terima kasih atas ketertarikan Anda!',
    templateId: '1',
    status: 'SENT',
    sentAt: new Date('2024-01-14T14:20:00'),
  },
  {
    id: '4',
    to: 'dewi.lestari@email.com',
    subject: 'Pengingat: Survei Properti Besok',
    templateId: '4',
    status: 'OPENED',
    sentAt: new Date('2024-01-14T16:00:00'),
  },
  {
    id: '5',
    to: 'rina.wati@email.com',
    subject: 'Selamat! Offer Anda diterima!',
    templateId: '5',
    status: 'DELIVERED',
    sentAt: new Date('2024-01-10T11:45:00'),
  },
]

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<typeof mockTemplates[0] | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [recipients, setRecipients] = useState<string[]>([])

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.currentTarget
    const templateSelect = form.querySelector('select[name="template"]') as HTMLSelectElement
    const subjectInput = form.querySelector('input[name="subject"]') as HTMLInputElement
    const recipientSelect = form.querySelector('select[multiple]') as HTMLSelectElement

    const selectedRecipients = Array.from(recipientSelect.selectedOptions).map(opt => opt.value)
    if (selectedRecipients.length === 0) {
      alert('Pilih minimal satu penerima')
      return
    }

    const subject = subjectInput.value || mockTemplates.find(t => t.id === templateSelect.value)?.subject || ''
    const recipientsList = selectedRecipients.join(', ')

    // Open email client with pre-filled data
    window.location.href = `mailto:${recipientsList}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('Email template terpilih...')}`
    setShowSendModal(false)
  }

  const statusClassMap: Record<string, string> = {
    'PENDING': 'status-new',
    'SENT': 'status-contacted',
    'DELIVERED': 'status-viewing',
    'OPENED': 'status-closed',
    'FAILED': 'status-lost',
    'BOUNCED': 'status-lost',
  }

  const filteredLogs = mockEmailLogs.filter((log) =>
    activeTab === 'logs' ? true : true
  )

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            <h1>Komunikasi</h1>
            <p>Template email dan riwayat campaign</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => setShowSendModal(true)}>
              + Kirim Email
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="card">
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--gray-100)' }}>
            <button
              onClick={() => setActiveTab('templates')}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'templates' ? '2px solid var(--primary)' : 'none',
                color: activeTab === 'templates' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'templates' ? 500 : 400,
                cursor: 'pointer',
              }}
            >
              Templates ({mockTemplates.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'logs' ? '2px solid var(--primary)' : 'none',
                color: activeTab === 'logs' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'logs' ? 500 : 400,
                cursor: 'pointer',
              }}
            >
              Riwayat Email ({mockEmailLogs.length})
            </button>
          </div>

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div style={{ marginTop: '20px' }}>
              <div className="grid-3">
                {mockTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      border: selectedTemplate?.id === template.id ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                      opacity: template.isActive ? 1 : 0.6,
                    }}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge">{template.category.replace('_', ' ')}</span>
                      {!template.isActive && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>Tidak Aktif</span>}
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                      {template.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '12px' }}>
                      {template.subject}
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--gray-600)' }}>
                      Variabel: {template.variables.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Logs Tab */}
          {activeTab === 'logs' && (
            <div className="table-container" style={{ marginTop: '20px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Kepada</th>
                    <th>Subjek</th>
                    <th>Template</th>
                    <th>Status</th>
                    <th>Tanggal Kirim</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.to}</td>
                      <td>{log.subject}</td>
                      <td>
                        {log.templateId && mockTemplates.find((t) => t.id === log.templateId)?.name}
                      </td>
                      <td>
                        <span className={`status ${statusClassMap[log.status] || ''}`}>
                          {log.status === 'SENT' ? 'Terkirim' : log.status === 'DELIVERED' ? 'Diterima' : log.status === 'OPENED' ? 'Dibuka' : log.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        {log.sentAt.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Template Preview/Edit */}
        {selectedTemplate && activeTab === 'templates' && (
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <h2 className="card-title">Template: {selectedTemplate.name}</h2>
              <button className="btn btn-sm btn-secondary" onClick={() => setSelectedTemplate(null)}>Tutup</button>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <div className="form-group">
                  <label>Nama Template</label>
                  <input type="text" className="form-control" defaultValue={selectedTemplate.name} disabled />
                </div>
                <div className="form-group">
                  <label>Subjek</label>
                  <input type="text" className="form-control" defaultValue={selectedTemplate.subject} disabled />
                </div>
                <div className="form-group">
                  <label>Kategori</label>
                  <input type="text" className="form-control" defaultValue={selectedTemplate.category} disabled />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="form-group">
                  <label>Preview Variabel</label>
                  <div style={{ padding: '12px', background: 'var(--gray-100)', borderRadius: '8px', fontSize: '13px' }}>
                    Variabel tersedia: {selectedTemplate.variables.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Email Modal */}
        {showSendModal && (
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
            onClick={() => setShowSendModal(false)}
          >
            <div
              className="card"
              style={{ width: '500px', maxWidth: '90vw' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-header">
                <h2 className="card-title">Kirim Email</h2>
                <button onClick={() => setShowSendModal(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSendEmail}>
                <div className="form-group">
                  <label>Penerima</label>
                  <select
                    multiple
                    className="form-control"
                    size={4}
                    style={{ minHeight: '100px' }}
                  >
                    {mockTemplates[0].variables.includes('namaDepan') && (
                      <>
                        <option value="budi.santoso@email.com">Budi Santoso (budi.santoso@email.com)</option>
                        <option value="siti.raahayu@email.com">Siti Rahayu (siti.raahayu@email.com)</option>
                        <option value="agus.wijaya@email.com">Agus Wijaya (agus.wijaya@email.com)</option>
                        <option value="dewi.lestari@email.com">Dewi Lestari (dewi.lestari@email.com)</option>
                      </>
                    )}
                  </select>
                  <p style={{ fontSize: '11px', color: 'var(--gray-600)', marginTop: '4px' }}>
                    Tahan Ctrl/Cmd untuk pilih beberapa
                  </p>
                </div>
                <div className="form-group">
                  <label>Template</label>
                  <select className="form-control">
                    {mockTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subjek</label>
                  <input type="text" className="form-control" />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowSendModal(false)}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary">Kirim Email</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
