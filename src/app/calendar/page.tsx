'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { INDONESIAN_NAMES, SAMPLE_ADDRESSES } from '@/lib/constants'
import { AppointmentType, AppointmentStatus } from '@prisma/client'
import { getAppointments, createAppointment as createAppointmentAction, updateAppointmentStatus } from '@/app/actions/appointments'

// Fallback mock data - Indonesian context
const generateMockAppointments = () => {
  const appointments = []
  const now = new Date()
  const titles = ['Survei Properti', 'Tanda Tangan Kontrak', 'Konsultasi', 'Follow Up']
  const cities = ['Jakarta Selatan', 'Bandung', 'Tangerang Selatan', 'Jakarta Pusat']

  for (let i = 0; i < 30; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() + (i - 15))
    date.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0)

    appointments.push({
      id: `${i}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      startTime: date,
      endTime: new Date(date.getTime() + 60 * 60 * 1000),
      lead: {
        name: INDONESIAN_NAMES[Math.floor(Math.random() * INDONESIAN_NAMES.length)],
        email: 'lead@email.com',
      },
      property: {
        title: SAMPLE_ADDRESSES[Math.floor(Math.random() * SAMPLE_ADDRESSES.length)],
        address: cities[Math.floor(Math.random() * cities.length)],
      },
      status: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'][Math.floor(Math.random() * 4)],
    })
  }

  return appointments
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const startDate = new Date(currentDate)
      startDate.setDate(startDate.getDate() - 30)
      const endDate = new Date(currentDate)
      endDate.setDate(endDate.getDate() + 60)

      const data = await getAppointments(startDate, endDate)
      setAppointments(data.length > 0 ? data : generateMockAppointments())
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      setAppointments(generateMockAppointments())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [currentDate])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Combine date and time into ISO datetime strings
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const startDateTime = new Date(`${date}T${time}`)
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000) // 1 hour

    formData.set('startTime', startDateTime.toISOString())
    formData.set('endTime', endDateTime.toISOString())

    try {
      await createAppointmentAction(formData)
      setShowAddModal(false)
      fetchAppointments()
    } catch (error) {
      console.error('Failed to create appointment:', error)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'SCHEDULED': 'Terjadwal',
      'CONFIRMED': 'Dikonfirmasi',
      'COMPLETED': 'Selesai',
      'CANCELLED': 'Batal',
    }
    return labels[status] || status
  }

  const getMonthData = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDay = firstDay.getDay() // 0 = Sunday
    const daysInMonth = lastDay.getDate()

    return { year, month, startDay, daysInMonth, firstDay, lastDay }
  }

  const getWeekDays = (date: Date) => {
    const week = []
    const start = new Date(date)
    start.setDate(start.getDate() - start.getDay())

    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      week.push(day)
    }

    return week
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime)
      return aptDate.toDateString() === date.toDateString()
    })
  }

  const monthData = getMonthData(currentDate)
  const calendarDays = []

  // Add empty cells for days before the first day of month
  for (let i = 0; i < monthData.startDay; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let i = 1; i <= monthData.daysInMonth; i++) {
    calendarDays.push(new Date(monthData.year, monthData.month, i))
  }

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  const navigateMonth = (delta: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + delta)
    setCurrentDate(newDate)
  }

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            <h1>Kalender</h1>
            <p>Jadwalkan survei dan kelola janji temu</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              + Janji Temu Baru
            </button>
          </div>
        </header>

        {/* Calendar Navigation */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigateMonth(-1)}
            >
              ← Sebelumnya
            </button>
            <h2 style={{ fontSize: '18px', margin: '0' }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigateMonth(1)}
            >
              Selanjutnya →
            </button>
          </div>
        </div>

        {/* Month Calendar */}
        {view === 'month' && (
          <div className="card">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '1px',
              background: 'var(--gray-200)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
            }}>
              {/* Day headers */}
              {dayNames.map((day) => (
                <div
                  key={day}
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'var(--gray-600)',
                    background: 'var(--white)',
                  }}
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((date, index) => {
                const isToday = date && date.toDateString() === new Date().toDateString()
                const dayAppointments = date ? getAppointmentsForDate(date) : []

                return (
                  <div
                    key={index}
                    onClick={() => date && setSelectedDate(date)}
                    style={{
                    minHeight: '100px',
                    padding: '8px',
                    background: date ? (isToday ? 'rgba(44,95,141,0.05)' : 'var(--white)') : 'var(--gray-100)',
                    cursor: date ? 'pointer' : 'default',
                  }}
                >
                  {date && (
                    <>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: isToday ? '600' : '500',
                        color: isToday ? 'var(--primary)' : 'var(--secondary)',
                        marginBottom: '4px',
                      }}>
                        {date.getDate()}
                      </div>
                      {dayAppointments.slice(0, 3).map((apt) => {
                        const status = apt.status || 'SCHEDULED'
                        const statusLabel = getStatusLabel(status)
                        return (
                          <div
                            key={apt.id}
                            style={{
                              fontSize: '11px',
                              padding: '2px 4px',
                              marginBottom: '2px',
                              borderRadius: '3px',
                              background: status === 'COMPLETED' ? '#10b981' : status === 'CANCELLED' ? '#ef4444' : 'var(--primary)',
                              color: 'white',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {apt.title}
                          </div>
                        )
                      })}
                      {dayAppointments.length > 3 && (
                        <div style={{ fontSize: '10px', color: 'var(--gray-600)' }}>
                          +{dayAppointments.length - 3} lagi
                        </div>
                      )}
                    </>
                  )}
                </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Selected Date Detail */}
        {selectedDate && (
          <div className="card" style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>
              {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            {getAppointmentsForDate(selectedDate).length === 0 ? (
              <p style={{ color: 'var(--gray-600)' }}>Tidak ada janji temu terjadwal</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {getAppointmentsForDate(selectedDate).map((apt) => (
                  <div
                    key={apt.id}
                    style={{
                      padding: '12px',
                      background: 'var(--gray-100)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{apt.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                        {new Date(apt.startTime).toLocaleTimeString('id-ID', { hour: 'numeric', minute: '2-digit' })} - {new Date(apt.endTime).toLocaleTimeString('id-ID', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                        {apt.lead.name} • {apt.property.title}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className={`status status-${apt.status?.toLowerCase() || 'scheduled'}`}>
                        {getStatusLabel(apt.status || 'SCHEDULED')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Appointment Modal */}
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
              <h2 className="card-title">Janji Temu Baru</h2>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Judul *</label>
                <input type="text" name="title" className="form-control" required placeholder="Contoh: Survei Properti" />
              </div>
              <div className="form-group">
                <label>Tipe</label>
                <select name="type" className="form-control">
                  <option value="VIEWING">Survei Properti</option>
                  <option value="CONSULTATION">Konsultasi</option>
                  <option value="CONTRACT_SIGNING">Tanda Tangan Kontrak</option>
                  <option value="FOLLOW_UP">Follow Up</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Tanggal *</label>
                  <input type="date" name="date" className="form-control" required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Waktu *</label>
                  <input type="time" name="time" className="form-control" required />
                </div>
              </div>
              <div className="form-group">
                <label>Lead</label>
                <select name="leadId" className="form-control">
                  <option value="">Pilih lead...</option>
                  <option value="1">Budi Santoso</option>
                  <option value="2">Siti Rahayu</option>
                  <option value="3">Agus Wijaya</option>
                </select>
              </div>
              <div className="form-group">
                <label>Properti</label>
                <select name="propertyId" className="form-control">
                  <option value="">Pilih properti...</option>
                  <option value="1">Rumah Modern Minimalis - Rp 2,5 Miliar</option>
                  <option value="2">Apartemen Mewah - Rp 1,5 Miliar</option>
                </select>
              </div>
              <div className="form-group">
                <label>Catatan</label>
                <textarea name="description" className="form-control" rows={2} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">Jadwalkan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
