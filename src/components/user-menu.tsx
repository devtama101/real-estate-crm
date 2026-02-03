'use client'

import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

// Session refresh event name (must match the one in profile-form)
const SESSION_REFRESH_EVENT = 'session-refresh'

interface User {
  id: string
  name: string
  email: string
  role?: string
  image?: string | null
}

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch fresh user data from database
    const fetchUser = async () => {
      try {
        // Try the fresh data endpoint first
        const res = await fetch('/api/user/me')
        const data = await res.json()

        if (data?.user) {
          setUser(data.user)
          return
        }

        // Fallback to session endpoint
        const sessionRes = await fetch('/api/auth/session')
        const sessionData = await sessionRes.json()
        if (sessionData?.user) {
          setUser(sessionData.user)
        }
      } catch (err) {
        setUser(null)
      }
    }

    fetchUser()

    // Listen for session refresh events (e.g., after avatar upload)
    const handleSessionRefresh = () => {
      fetchUser()
    }

    window.addEventListener(SESSION_REFRESH_EVENT, handleSessionRefresh)

    return () => {
      window.removeEventListener(SESSION_REFRESH_EVENT, handleSessionRefresh)
    }
  }, [])

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
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

  if (!user) {
    return (
      <div className="user-menu-section">
        <button className="user-menu-trigger-skeleton">
          <div className="skeleton-avatar-sm"></div>
          <div className="skeleton-text-sm"></div>
        </button>
      </div>
    )
  }

  const avatarColor = getAvatarColor(user.name)
  const initials = getInitials(user.name)

  return (
    <div className="user-menu-section" ref={menuRef}>
      {/* Menu Trigger Button - Full width like nav item */}
      <button
        className="user-menu-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div
          className="user-avatar-small"
          style={{ background: avatarColor }}
        >
          {user.image ? (
            <img src={user.image} alt={user.name} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <span className="user-menu-name">{user.name}</span>
        <svg
          className={`user-chevron ${isOpen ? 'open' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M4 10l4-4 4 4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Sliding Drawer Panel */}
      <div className={`user-drawer ${isOpen ? 'open' : ''}`}>
        {/* Handle bar at top */}
        <div className="drawer-handle"></div>

        {/* User Info Header */}
        <div className="drawer-header">
          <div
            className="drawer-avatar"
            style={{ background: avatarColor }}
          >
            {user.image ? (
              <img src={user.image} alt={user.name} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="drawer-user-info">
            <div className="drawer-name">{user.name}</div>
            <div className="drawer-email">{user.email}</div>
            <div className="drawer-role">
              {user.role === 'ADMIN' ? 'Administrator' : 'Agent'}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="drawer-menu">
          <Link
            href="/profile"
            className="drawer-item"
            onClick={() => setIsOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edit Profile
          </Link>

          <button
            className="drawer-item drawer-item-danger"
            onClick={handleLogout}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 3v4m0 0h4m-4 0H8m4 0h4M9 7h6m-6 0h6m-6 0v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Log Out
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && <div className="drawer-backdrop" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
