'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login after 3 seconds
    const timer = setTimeout(() => {
      router.push('/login')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #2c5f8d 0%, #1e3a5f 100%)',
      padding: '20px',
    }}>
      <div
        style={{
          width: '100%',
          maxWidth: '450px',
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{ fontSize: '24px', color: '#dc2626', marginBottom: '16px' }}>
          Authentication Error
        </h1>
        <p style={{ color: '#666', marginBottom: '12px' }}>
          {error?.message || 'Terjadi kesalahan saat login.'}
        </p>
        {error?.digest && (
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
            Error Code: {error.digest}
          </p>
        )}
        <p style={{ fontSize: '14px', color: '#999' }}>
          Mengalih ke halaman login dalam 3 detik...
        </p>
        <button
          onClick={() => router.push('/login')}
          style={{
            padding: '12px 24px',
            background: '#2c5f8d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Kembali ke Login
        </button>
      </div>
    </div>
  )
}
