'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'
import { UserMenu } from '@/components/user-menu'

export function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Fetch user role on mount
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.user) {
          setUserRole(data.user.role || null)
        }
      })
      .catch(() => setUserRole(null))
  }, [])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/' || pathname === '/dashboard'
    return pathname?.startsWith(href)
  }

  const isAdmin = userRole === 'ADMIN'

  // Filter management items based on role
  const managementItems = NAV_ITEMS.management.filter((item) => {
    // Admin, Analytics and Settings are admin-only
    if (item.href === '/admin' || item.href === '/settings/users' || item.href.startsWith('/admin/analytics')) {
      return isAdmin
    }
    return true
  })

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/dashboard" className="logo">
          <div className="logo-icon">🏠</div>
          PropertyPro
        </Link>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Main</div>
          {NAV_ITEMS.main.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Management</div>
          {managementItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Menu at Bottom */}
        <UserMenu />
      </nav>
    </aside>
  )
}
