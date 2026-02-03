import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/sidebar'
import bcrypt from 'bcryptjs'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

async function createUser(formData: FormData) {
  'use server'

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  if (!name || !email || !password || !role) {
    redirect('/settings/users/new?error=required')
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    redirect('/settings/users/new?error=email_exists')
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role as 'ADMIN' | 'AGENT',
    },
  })

  revalidatePath('/settings/users')
  redirect('/settings/users')
}

export default function NewUserPage() {
  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h1>Tambah User Baru</h1>
            <p>Tambahkan user baru ke sistem</p>
          </div>
        </header>

        <div style={{ maxWidth: '600px' }}>
          <form action={createUser} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label>Nama Lengkap *</label>
              <input
                name="name"
                type="text"
                required
                className="form-control"
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
                placeholder="email@example.com"
              />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                name="password"
                type="password"
                required
                className="form-control"
                placeholder="Minimal 6 karakter"
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>Role *</label>
              <select name="role" className="form-control" required>
                <option value="">Pilih role</option>
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Link href="/settings/users" className="btn btn-secondary">Batal</Link>
              <button type="submit" className="btn btn-primary">Simpan User</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
