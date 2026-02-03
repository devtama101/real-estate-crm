import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/sidebar'
import { revalidatePath } from 'next/cache'

async function deleteUser(formData: FormData) {
  'use server'

  const userId = formData.get('userId') as string

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  })

  if (!admin) {
    redirect('/settings/users?error=No admin found')
  }

  // Prevent deleting the last admin
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
  const targetUser = await prisma.user.findUnique({ where: { id: userId } })

  if (!targetUser) {
    redirect('/settings/users?error=User not found')
  }

  if (targetUser.role === 'ADMIN' && adminCount <= 1) {
    redirect('/settings/users?error=Cannot delete the last admin')
  }

  // Delete associated leads
  await prisma.lead.deleteMany({ where: { assignedToId: userId } })

  // Delete user
  await prisma.user.delete({ where: { id: userId } })

  revalidatePath('/admin')
  revalidatePath('/settings/users')

  redirect('/settings/users')
}

async function getUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      _count: { select: { leads: true } },
    },
  })
  return user
}

export default async function DeleteUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
            <h1>Hapus User</h1>
            <p>Konfirmasi penghapusan user</p>
          </div>
        </header>

        <div style={{ maxWidth: '600px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ marginTop: 0 }}>Hapus User?</h2>
            <p style={{ marginBottom: '16px' }}>
              Anda yakin ingin menghapus user <strong>{user.name}</strong> ({user.email})?
            </p>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              {user._count.leads > 0 && (
                <span style={{ color: '#dc2626' }}>
                  ⚠️ User ini memiliki {user._count.leads} lead yang terkait. Leads tersebut juga akan dihapus.
                </span>
              )}
            </p>

            <form action={deleteUser} style={{ display: 'flex', gap: '12px' }}>
              <input type="hidden" name="userId" value={user.id} />
              <a href="/settings/users" className="btn btn-secondary">
                Batal
              </a>
              <button
                type="submit"
                className="btn"
                style={{
                  padding: '8px 16px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Ya, Hapus User
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
