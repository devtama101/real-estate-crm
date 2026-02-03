'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/sidebar'
import { LEAD_STATUS, LEAD_SOURCE, formatIDR } from '@/lib/constants'
import { LeadStatus, LeadSource } from '@prisma/client'
import { getLeads, updateLeadStatus, createLead as createLeadAction, getCurrentUserRole, getAllAgents } from '@/app/actions/leads'

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)

  // Fetch leads
  const fetchLeads = async () => {
    setLoading(true)
    try {
      const filters: any = {}
      if (filterStatus !== 'all') filters.status = filterStatus as LeadStatus
      if (filterSource !== 'all') filters.source = filterSource as LeadSource
      if (filterAgent !== 'all') filters.assignedToId = filterAgent
      if (searchQuery) filters.search = searchQuery

      const data = await getLeads(filters)
      setLeads(data)
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch current user and agents on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [user, agentsData] = await Promise.all([
          getCurrentUserRole(),
          getAllAgents(),
        ])
        setCurrentUser(user)
        setAgents(agentsData)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [filterStatus, filterSource, filterAgent, searchQuery])

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedLeads(newSelected)
  }

  const updateStatusHandler = async (id: string, newStatus: string) => {
    try {
      await updateLeadStatus(id, newStatus as LeadStatus)
      fetchLeads()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      await createLeadAction(formData)
      setShowAddModal(false)
      fetchLeads()
    } catch (error) {
      console.error('Failed to create lead:', error)
    }
  }

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
            <h1>Leads</h1>
            <p>Kelola leads dan lacak perjalanannya</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              + Tambah Lead
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
                placeholder="Cari leads..."
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
              {Object.values(LEAD_STATUS).map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="all">Semua Sumber</option>
              {Object.values(LEAD_SOURCE).map((source) => (
                <option key={source.value} value={source.value}>{source.label}</option>
              ))}
            </select>
            {currentUser?.role === 'ADMIN' && (
              <select
                className="form-control"
                style={{ width: 'auto' }}
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
              >
                <option value="all">Semua Agent</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div className="stat-content">
              <h3>{leads.length}</h3>
              <p>Total Leads</p>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div className="stat-content">
              <h3>{leads.filter((l) => l.status === 'NEW').length}</h3>
              <p>Leads Baru</p>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div className="stat-content">
              <h3>{leads.filter((l) => l.status === 'VIEWING' || l.status === 'NEGOTIATION').length}</h3>
              <p>Aktif</p>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div className="stat-content">
              <h3>{leads.filter((l) => l.status === 'CLOSED').length}</h3>
              <p>Closing (Bulan Ini)</p>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === leads.length && leads.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeads(new Set(leads.map((l) => l.id)))
                        } else {
                          setSelectedLeads(new Set())
                        }
                      }}
                    />
                  </th>
                  <th>Nama</th>
                  <th>Kontak</th>
                  <th>Budget</th>
                  <th>Tipe Properti</th>
                  <th>Sumber</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{lead.name}</div>
                      {lead.tags && lead.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                          {lead.tags.map((tag: string) => (
                            <span key={tag} className="badge">{tag}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{lead.email || '-'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{lead.phone || '-'}</div>
                    </td>
                    <td>{lead.budgetDisplay || '-'}</td>
                    <td>{lead.propertyType || '-'}</td>
                    <td>{lead.source || '-'}</td>
                    <td>
                      <select
                        className={`status ${statusClassMap[lead.status] || ''}`}
                        style={{ border: 'none', cursor: 'pointer', fontWeight: 500 }}
                        value={lead.status}
                        onChange={(e) => updateStatusHandler(lead.id, e.target.value)}
                      >
                        {Object.values(LEAD_STATUS).map((status) => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="btn btn-sm btn-secondary"
                        >
                          Lihat
                        </Link>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            const email = lead.email || ''
                            const name = lead.name || ''
                            window.location.href = `mailto:${email}?subject=PropertyPro Indonesia - Follow Up&body=Halo ${name},%0D%0A%0D%0ATerima kasih telah menghubungi kami.`
                          }}
                          title="Kirim Email"
                        >
                          ✉️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {leads.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray-600)' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>👥</p>
            <p>Tidak ada lead ditemukan</p>
          </div>
        )}
      </main>

      {/* Add Lead Modal */}
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
            style={{ width: '500px', maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <h2 className="card-title">Tambah Lead Baru</h2>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nama *</label>
                <input type="text" name="name" className="form-control" required />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Email</label>
                  <input type="email" name="email" className="form-control" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>No. HP</label>
                  <input type="tel" name="phone" className="form-control" placeholder="+62..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Budget Min (Rp)</label>
                  <input type="number" name="budgetMin" className="form-control" placeholder="1500000000" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Budget Max (Rp)</label>
                  <input type="number" name="budgetMax" className="form-control" placeholder="2000000000" />
                </div>
              </div>
              <div className="form-group">
                <label>Tipe Properti</label>
                <select name="propertyType" className="form-control">
                  <option value="">Pilih...</option>
                  <option value="Rumah">Rumah</option>
                  <option value="Apartemen">Apartemen</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Ruko">Ruko</option>
                </select>
              </div>
              <div className="form-group">
                <label>Sumber</label>
                <select name="source" className="form-control">
                  <option value="Website">Website</option>
                  <option value="Rumah123">Rumah123</option>
                  <option value="Lamudi">Lamudi</option>
                  <option value="OLX">OLX Properti</option>
                  <option value="Referral">Referral</option>
                  <option value="Media Sosial">Media Sosial</option>
                </select>
              </div>
              <div className="form-group">
                <label>Catatan</label>
                <textarea name="notes" className="form-control" rows={3} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">Simpan Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
