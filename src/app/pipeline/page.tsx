'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { LeadStatus } from '@prisma/client'
import { getLeads, updateLeadStatus } from '@/app/actions/leads'

const stageConfig = [
  { key: LeadStatus.NEW, title: 'Baru', color: '#3b82f6' },
  { key: LeadStatus.CONTACTED, title: 'Dihubungi', color: '#8b5cf6' },
  { key: LeadStatus.VIEWING, title: 'Survei', color: '#f59e0b' },
  { key: LeadStatus.NEGOTIATION, title: 'Negosiasi', color: '#ec4899' },
  { key: LeadStatus.CLOSED, title: 'Closing', color: '#10b981' },
]

export default function PipelinePage() {
  const router = useRouter()
  const [pipelineData, setPipelineData] = useState<Record<LeadStatus, any[]>>({
    [LeadStatus.NEW]: [],
    [LeadStatus.CONTACTED]: [],
    [LeadStatus.VIEWING]: [],
    [LeadStatus.NEGOTIATION]: [],
    [LeadStatus.CLOSED]: [],
    [LeadStatus.LOST]: [],
  })
  const [draggedItem, setDraggedItem] = useState<{ stage: string; id: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch real leads on mount
  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const leads = await getLeads({})
      // Group leads by status
      const grouped: Record<LeadStatus, any[]> = {
        [LeadStatus.NEW]: [],
        [LeadStatus.CONTACTED]: [],
        [LeadStatus.VIEWING]: [],
        [LeadStatus.NEGOTIATION]: [],
        [LeadStatus.CLOSED]: [],
        [LeadStatus.LOST]: [],
      }
      for (const lead of leads) {
        if (grouped[lead.status as LeadStatus]) {
          grouped[lead.status as LeadStatus].push(lead)
        }
      }
      setPipelineData(grouped)
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (stage: string, id: string) => {
    setDraggedItem({ stage, id })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetStage: LeadStatus) => {
    if (!draggedItem) return

    const sourceStage = draggedItem.stage as LeadStatus
    const item = pipelineData[sourceStage]?.find((i) => i.id === draggedItem.id)

    if (item && sourceStage !== targetStage) {
      // Update in UI first
      setPipelineData((prev) => {
        const newData = { ...prev }
        newData[sourceStage] = newData[sourceStage].filter((i) => i.id !== draggedItem.id)
        newData[targetStage] = [...(newData[targetStage] || []), { ...item, status: targetStage }]
        return newData
      })

      // Update in database
      try {
        await updateLeadStatus(draggedItem.id, targetStage)
      } catch (error) {
        console.error('Failed to update lead status:', error)
        // Revert on error
        fetchLeads()
      }
    }
    setDraggedItem(null)
  }

  const handleViewLead = (leadId: string) => {
    router.push(`/leads/${leadId}`)
  }

  const handleSendEmail = (email: string, name: string) => {
    window.location.href = `mailto:${email}?subject=PropertyPro Indonesia - Follow Up&body=Halo ${name},%0D%0A%0D%0ATerima kasih telah menghubungi kami.`
  }

  const getBudgetDisplay = (lead: any) => {
    if (lead.budgetMin && lead.budgetMax) {
      return `Rp ${(lead.budgetMin / 1000000).toFixed(0)} - ${(lead.budgetMax / 1000000).toFixed(0)} Miliar`
    }
    if (lead.budgetMin) {
      return `Rp ${lead.budgetMin / 1000000} Miliar+`
    }
    return '-'
  }

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            <h1>Pipeline</h1>
            <p>Lacak lead melalui pipeline penjualan Anda</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => router.push('/leads/new')}
            >
              + Tambah Lead
            </button>
          </div>
        </header>

        {/* Pipeline Stats */}
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          {stageConfig.map((stage) => {
            const count = pipelineData[stage.key as LeadStatus]?.length || 0
            return (
              <div key={stage.key} className="stat-card" style={{ padding: '16px' }}>
                <div className="stat-content">
                  <h3 style={{ color: stage.color }}>{count}</h3>
                  <p>{stage.title}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <div className="pipeline-container">
            {stageConfig.map((stage) => (
              <div
                key={stage.key}
                className="pipeline-column"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.key as LeadStatus)}
              >
                <div className="pipeline-header">
                  <span className="pipeline-title" style={{ color: stage.color }}>
                    {stage.title}
                  </span>
                  <span className="pipeline-count">
                    {pipelineData[stage.key as LeadStatus]?.length || 0}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pipelineData[stage.key as LeadStatus]?.map((lead) => (
                    <div
                      key={lead.id}
                      className="pipeline-card"
                      draggable
                      onDragStart={() => handleDragStart(stage.key as LeadStatus, lead.id)}
                    >
                      <div className="pipeline-card-name">{lead.name}</div>
                      <div className="pipeline-card-info">{lead.propertyType || '-'}</div>
                      <div className="pipeline-card-info">{getBudgetDisplay(lead)}</div>
                      <div className="pipeline-card-footer">
                        <span style={{ fontSize: '11px', color: 'var(--gray-600)' }}>{lead.email || '-'}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '11px' }}
                            title="Lihat Detail"
                            onClick={() => handleViewLead(lead.id)}
                          >
                            👁️
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '11px' }}
                            title="Kirim Email"
                            onClick={() => handleSendEmail(lead.email, lead.name)}
                          >
                            ✉️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {stage.key === LeadStatus.NEW && (
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '8px', padding: '8px', fontSize: '13px' }}
                    onClick={() => router.push('/leads/new')}
                  >
                    + Tambah ke {stage.title}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Lost Column */}
        <div style={{ marginTop: '20px', padding: '16px', background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '12px' }}>Lead Batal</h3>
          <p style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
            Lead yang tidak konversi diarsipkan di sini untuk follow-up di masa depan.
          </p>
        </div>
      </main>
    </div>
  )
}
