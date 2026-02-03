'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Event name for session refresh
export const SESSION_REFRESH_EVENT = 'session-refresh'

interface User {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  createdAt: string
}

interface ProfileFormProps {
  user: User
  showSuccess: boolean
  updateProfileAction: (formData: FormData) => Promise<any>
  uploadAvatarAction: (formData: FormData) => Promise<any>
}

const getInitials = (name: string) => {
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const getAvatarColor = (name: string) => {
  const colors = [
    '#2c5f8d', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#f59e0b', '#eab308', '#84cc16', '#10b981'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function ProfileForm({ user, showSuccess, updateProfileAction, uploadAvatarAction }: ProfileFormProps) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(user)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(showSuccess)
  const [formData, setFormData] = useState({ name: user.name, email: user.email })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Function to refresh session across the app
  const refreshSession = async () => {
    try {
      // Fetch fresh user data from database
      const res = await fetch('/api/user/me')
      const data = await res.json()

      if (data?.user) {
        // Dispatch event for other components to listen to
        window.dispatchEvent(new CustomEvent(SESSION_REFRESH_EVENT, { detail: data }))
      }
    } catch (err) {
      console.error('Failed to refresh session:', err)
    }
  }

  useEffect(() => {
    if (showSuccess) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }, [showSuccess])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const formFormData = new FormData()
    formFormData.append('name', formData.name)
    formFormData.append('email', formData.email)

    // Add password fields if they exist
    const currentPassword = (e.currentTarget.elements.namedItem('currentPassword') as HTMLInputElement)?.value
    const newPassword = (e.currentTarget.elements.namedItem('newPassword') as HTMLInputElement)?.value
    const confirmPassword = (e.currentTarget.elements.namedItem('confirmPassword') as HTMLInputElement)?.value

    if (currentPassword) formFormData.append('currentPassword', currentPassword)
    if (newPassword) formFormData.append('newPassword', newPassword)
    if (confirmPassword) formFormData.append('confirmPassword', confirmPassword)

    try {
      const result = await updateProfileAction(formFormData)
      if (result.error) {
        setError(result.error)
        setSaving(false)
        return
      }
      // Update local state with new values
      setCurrentUser({ ...currentUser, name: formData.name, email: formData.email })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

      // Refresh session across the app
      await refreshSession()

      // Clear password fields
      if (currentPassword) {
        const currentPassEl = e.currentTarget.elements.namedItem('currentPassword') as unknown as HTMLInputElement | null
        if (currentPassEl?.value) currentPassEl.value = ''
        const newPassEl = e.currentTarget.elements.namedItem('newPassword') as unknown as HTMLInputElement | null
        if (newPassEl?.value) newPassEl.value = ''
        const confirmPassEl = e.currentTarget.elements.namedItem('confirmPassword') as unknown as HTMLInputElement | null
        if (confirmPassEl?.value) confirmPassEl.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui profil')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Hanya file gambar yang diperbolehkan')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file maksimal 2MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const result = await uploadAvatarAction(formData)
      if (result.error) {
        setError(result.error)
        setUploading(false)
        return
      }

      // Update local state
      setCurrentUser({ ...currentUser, image: result.image })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

      // Refresh session across the app
      await refreshSession()
    } catch (err: any) {
      setError(err.message || 'Gagal mengupload avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('removeAvatar', 'true')

      const result = await updateProfileAction(formData)
      if (result.error) {
        setError(result.error)
        setUploading(false)
        return
      }

      setCurrentUser({ ...currentUser, image: null })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

      // Refresh session across the app
      await refreshSession()
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus avatar')
    } finally {
      setUploading(false)
    }
  }

  const avatarColor = currentUser.image ? undefined : getAvatarColor(currentUser.name)
  const initials = getInitials(currentUser.name)

  return (
    <>
      <div style={{ maxWidth: '600px' }}>
        {success && (
          <div style={{
            padding: '12px 16px',
            background: '#dcfce7',
            color: '#15803d',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #86efac',
          }}>
            ✓ Profil berhasil diperbarui
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #fca5a5',
          }}>
            {error}
          </div>
        )}

        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
          {/* Avatar Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--gray-200)' }}>
            <div style={{ position: 'relative' }}>
              <div
                onClick={handleAvatarClick}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: currentUser.image
                    ? `url(${currentUser.image}) center/cover`
                    : avatarColor || 'linear-gradient(135deg, #2c5f8d, #3b82f6)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  position: 'relative',
                  border: currentUser.image ? '3px solid white' : 'none',
                  boxShadow: currentUser.image ? '0 0 0 2px var(--gray-200)' : 'none',
                }}
              >
                {!currentUser.image && <span>{initials}</span>}
              </div>

              {/* Upload Overlay */}
              <div
                onClick={handleAvatarClick}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0'
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
              >
                <span style={{ color: 'white', fontSize: '24px' }}>📷</span>
              </div>

              {uploading && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid var(--gray-200)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>{currentUser.name}</h2>
              <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '14px' }}>
                {currentUser.email}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={uploading || saving}
                  className="btn btn-sm btn-secondary"
                >
                  {currentUser.image ? 'Ganti Avatar' : 'Upload Avatar'}
                </button>
                {currentUser.image && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploading || saving}
                    className="btn btn-sm"
                    style={{
                      padding: '6px 14px',
                      fontSize: '13px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: 'var(--radius)',
                      cursor: (uploading || saving) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Hapus
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label>Nama Lengkap *</label>
              <input
                name="name"
                type="text"
                required
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                name="email"
                type="email"
                required
                className="form-control"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div style={{ height: '1px', background: 'var(--gray-200)', margin: '8px 0' }}></div>

            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>
              Ubah Password
            </div>

            <div className="form-group">
              <label>Password Saat Ini</label>
              <input
                name="currentPassword"
                type="password"
                className="form-control"
                placeholder="Masukkan untuk konfirmasi perubahan"
              />
              <p style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>
                Diperlukan hanya jika mengubah password
              </p>
            </div>

            <div className="form-group">
              <label>Password Baru</label>
              <input
                name="newPassword"
                type="password"
                className="form-control"
                placeholder="Minimal 6 karakter (opsional)"
              />
            </div>

            <div className="form-group">
              <label>Konfirmasi Password Baru</label>
              <input
                name="confirmPassword"
                type="password"
                className="form-control"
                placeholder="Ulangi password baru (opsional)"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || uploading}
                style={{
                  padding: '10px 24px',
                }}
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '14px' }}>Informasi Akun</h3>
          <p style={{ fontSize: '13px', color: 'var(--gray-600)', margin: '0 0 4px' }}>
            Bergabung sejak: {new Date(currentUser.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--gray-600)', margin: 0 }}>
            Role: {currentUser.role === 'ADMIN' ? 'Administrator' : 'Agent'}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
