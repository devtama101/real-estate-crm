import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/sidebar'
import bcrypt from 'bcryptjs'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

async function getUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })
  return user
}

async function updateUser(userId: string, formData: FormData) {
  'use server'

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const newPassword = formData.get('newPassword') as string

  if (!name || !email || !role) {
    redirect(`/settings/users/${userId}?error=required`)
  }

  // Check if email already exists (excluding current user)
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      NOT: { id: userId },
    },
  })

  if (existingUser) {
    redirect(`/settings/users/${userId}?error=email_exists`)
  }

  // Prepare update data
  const updateData: any = {
    name,
    email,
    role: role as 'ADMIN' | 'AGENT',
  }

  // Update password if provided
  if (newPassword && newPassword.length >= 6) {
    updateData.password = await bcrypt.hash(newPassword, 10)
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })

  revalidatePath('/settings/users')
  redirect('/settings/users')
}

async function resetPassword(userId: string) {
  'use server'

  // Reset to a default password
  const defaultPassword = 'password123'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })

  revalidatePath('/settings/users')
  redirect('/settings/users?reset=true')
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(id)

  if (!user) {
    notFound()
  }

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h1>Edit User</h1>
            <p>Edit informasi dan password user</p>
          </div>
        </header>

        <div style={{ maxWidth: '600px' }}>
          <form action={updateUser.bind(null, user.id)} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label>Nama Lengkap *</label>
              <input
                name="name"
                type="text"
                required
                className="form-control"
                defaultValue={user.name || ''}
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
                defaultValue={user.email || ''}
                placeholder="email@example.com"
              />
            </div>

            <div className="form-group">
              <label>Role *</label>
              <select name="role" className="form-control" required defaultValue={user.role || 'AGENT'}>
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>Password Baru (opsional)</label>
              <input
                name="newPassword"
                type="password"
                className="form-control"
                placeholder="Kosongkan jika tidak ingin mengubah"
                minLength={6}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Minimal 6 karakter. Kosongkan jika tidak ingin mengubah password.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Link href="/settings/users" className="btn btn-secondary">Batal</Link>
              <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
            </div>
          </form>

          <div className="card" style={{ marginTop: '24px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px' }}>Reset Password</h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              Reset password user ke password default: <strong>password123</strong>
            </p>
            <form action={resetPassword.bind(null, user.id)}>
              <button
                type="submit"
                className="btn"
                style={{
                  padding: '8px 16px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Reset Password
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
