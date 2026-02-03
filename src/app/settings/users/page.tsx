import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/sidebar'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

async function getUsers() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Get stats for each user
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const leadsCount = await prisma.lead.count({ where: { assignedToId: user.id } })
      return { ...user, leadsCount }
    })
  )

  return { users: usersWithStats }
}

async function deleteUser(userId: string) {
  'use server'

  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/settings/users?error=unauthorized')
  }

  // Prevent deleting yourself
  if (userId === session.user.id) {
    redirect('/settings/users?error=cannot_delete_self')
  }

  // Reassign leads to admin or delete
  await prisma.lead.deleteMany({ where: { assignedToId: userId } })
  await prisma.user.delete({ where: { id: userId } })

  revalidatePath('/admin', 'layout')
  revalidatePath('/settings/users')
  redirect('/settings/users')
}

export default async function SettingsUsersPage() {
  const data = await getUsers()

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h1>Pengaturan</h1>
            <p>Tambah dan kelola pengguna aplikasi</p>
          </div>
          <div className="header-actions">
            <Link href="/settings/users/new" className="btn btn-primary">
              + Tambah User
            </Link>
          </div>
        </header>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Jumlah Leads</th>
                <th>Tanggal Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 500 }}>{user.name}</td>
                  <td style={{ fontSize: '13px' }}>{user.email}</td>
                  <td>
                    <span className={`status ${user.role === 'ADMIN' ? 'status-closed' : 'status-new'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.leadsCount}</td>
                  <td style={{ fontSize: '13px' }}>
                    {new Date(user.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td>
                    <Link
                      href={`/settings/users/${user.id}`}
                      className="btn btn-sm btn-secondary"
                      style={{ marginRight: '4px' }}
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/settings/users/${user.id}/delete`}
                      className="btn btn-sm"
                      style={{
                        padding: '6px 12px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    >
                      Hapus
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
