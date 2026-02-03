'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/sidebar'
import { LeadStatus, LeadSource } from '@prisma/client'
import { formatIDR, LEAD_STATUS, LEAD_SOURCE } from '@/lib/constants'
import { getLead, updateLead, updateLeadStatus } from '@/app/actions/leads'
import { getLeadActivities, createActivity } from '@/app/actions/activities'

const statusClassMap: Record<string, string> = {
  'NEW': 'status-new',
  'CONTACTED': 'status-contacted',
  'VIEWING': 'status-viewing',
  'NEGOTIATION': 'status-negotiation',
  'CLOSED': 'status-closed',
  'LOST': 'status-lost',
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  const [lead, setLead] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    fetchLead()
    fetchActivities()
  }, [leadId])

  const fetchLead = async () => {
    try {
      const data = await getLead(leadId)
      setLead(data)
    } catch (error) {
      console.error('Failed to fetch lead:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const data = await getLeadActivities(leadId)
      setActivities(data)
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateLeadStatus(leadId, newStatus as LeadStatus)
      fetchLead()
      fetchActivities()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    try {
      await createActivity({
        type: 'NOTE',
        description: newNote,
        leadId,
      })
      setNewNote('')
      setShowNoteModal(false)
      fetchActivities()
    } catch (error) {
      console.error('Failed to add note:', error)
    }
  }

  const handleUpdate = async (formData: FormData) => {
    try {
      await updateLead(leadId, formData)
      fetchLead()
    } catch (error) {
      console.error('Failed to update lead:', error)
    }
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      'CALL': '📞',
      'EMAIL': '📧',
      'SMS': '💬',
      'MEETING': '🤝',
      'NOTE': '📝',
      'STATUS_CHANGE': '🔄',
      'VIEWING_SCHEDULED': '📅',
      'PROPERTY_MATCHED': '🏠',
      'EMAIL_SENT': '✉️',
      'REMINDER_SENT': '⏰',
    }
    return icons[type] || '📌'
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

  if (!lead) {
    return (
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Lead tidak ditemukan</p>
            <Link href="/leads" className="btn btn-primary">Kembali ke Daftar Lead</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <header className="header" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/leads" className="btn btn-secondary btn-sm">← Kembali</Link>
            <div className="header-title">
              <h1>{lead.name}</h1>
              <p>Detail lead dan riwayat aktivitas</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => setShowNoteModal(true)}>
              + Tambah Catatan
            </button>
          </div>
        </header>

        <div className="grid-2">
          {/* Lead Info */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '20px' }}>Informasi Lead</h2>

            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{ marginTop: '8px' }}
              >
                {Object.values(LEAD_STATUS).map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label">Email</label>
                <div style={{ marginTop: '8px', fontSize: '14px' }}>
                  {lead.email || <span style={{ color: 'var(--gray-600)' }}>-</span>}
                </div>
              </div>
              <div>
                <label className="form-label">No. HP</label>
                <div style={{ marginTop: '8px', fontSize: '14px' }}>
                  {lead.phone || <span style={{ color: 'var(--gray-600)' }}>-</span>}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label className="form-label">Budget</label>
              <div style={{ marginTop: '8px', fontSize: '15px', fontWeight: 500 }}>
                {lead.budgetDisplay || (lead.budgetMin && lead.budgetMax
                  ? `${formatIDR(lead.budgetMin)} - ${formatIDR(lead.budgetMax)}`
                  : '-'
                )}
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label className="form-label">Kriteria Properti</label>
              <div style={{ marginTop: '8px' }}>
                {lead.propertyType && (
                  <span className="badge" style={{ marginRight: '8px' }}>{lead.propertyType}</span>
                )}
                {lead.bedrooms && (
                  <span className="badge" style={{ marginRight: '8px' }}>{lead.bedrooms}+ KT</span>
                )}
                {lead.bathrooms && (
                  <span className="badge">{lead.bathrooms}+ KM</span>
                )}
                {!lead.propertyType && !lead.bedrooms && !lead.bathrooms && '-'}
              </div>
            </div>

            {lead.preferredAreas && lead.preferredAreas.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <label className="form-label">Area Dicari</label>
                <div style={{ marginTop: '8px' }}>
                  {lead.preferredAreas.map((area: string) => (
                    <span key={area} className="badge" style={{ marginRight: '8px' }}>{area}</span>
                  ))}
                </div>
              </div>
            )}

            {lead.tags && lead.tags.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <label className="form-label">Tags</label>
                <div style={{ marginTop: '8px' }}>
                  {lead.tags.map((tag: string) => (
                    <span key={tag} className="badge" style={{
                      background: 'var(--primary)',
                      color: 'white',
                      marginRight: '8px'
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <label className="form-label">Sumber</label>
              <div style={{ marginTop: '8px' }}>
                {LEAD_SOURCE[lead.source as keyof typeof LEAD_SOURCE]?.label || lead.source}
              </div>
            </div>

            {lead.notes && (
              <div style={{ marginTop: '20px' }}>
                <label className="form-label">Catatan</label>
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: 'var(--gray-100)',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  {lead.notes}
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--gray-600)' }}>
              Dibuat: {new Date(lead.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '20px' }}>Riwayat Aktivitas</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activities.length === 0 ? (
                <p style={{ color: 'var(--gray-600)', textAlign: 'center', padding: '20px' }}>
                  Belum ada aktivitas
                </p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--gray-100)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '20px' }}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{activity.description}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                        {new Date(activity.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--gray-200)' }}>
              <h3 style={{ marginBottom: '12px' }}>Log Aktivitas Cepat</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => {
                  createActivity({ type: 'CALL', description: 'Telepon dengan lead', leadId })
                  fetchActivities()
                }}>
                  📞 Telepon
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => {
                  createActivity({ type: 'EMAIL', description: 'Email terkirim ke lead', leadId })
                  fetchActivities()
                }}>
                  📧 Email
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => {
                  createActivity({ type: 'MEETING', description: 'Meeting dengan lead', leadId })
                  fetchActivities()
                }}>
                  🤝 Meeting
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => setShowNoteModal(true)}>
                  📝 Catatan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Note Modal */}
        {showNoteModal && (
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
            onClick={() => setShowNoteModal(false)}
          >
            <div
              className="card"
              style={{ width: '400px', maxWidth: '90vw' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-header">
                <h2 className="card-title">Tambah Catatan</h2>
                <button onClick={() => setShowNoteModal(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>
              <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Tulis catatan..."
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowNoteModal(false)}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
