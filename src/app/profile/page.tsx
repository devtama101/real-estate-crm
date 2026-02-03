import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { Sidebar } from '@/components/sidebar'
import ProfileForm from './profile-form'

async function getProfile() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  // Ensure name is not null and convert Date to string for type compatibility
  return {
    id: user.id,
    name: user.name || '',
    email: user.email,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }
}

async function updateProfileAction(formData: FormData) {
  'use server'

  const session = await auth()
  if (!session?.user) {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const removeAvatar = formData.get('removeAvatar') as string

  if (!name || !email) {
    return { error: 'Nama dan email wajib diisi' }
  }

  // Check if user wants to change password
  if (newPassword) {
    if (!currentPassword) {
      return { error: 'Masukkan password saat ini untuk mengubah password' }
    }

    if (newPassword !== confirmPassword) {
      return { error: 'Password baru tidak cocok' }
    }

    if (newPassword.length < 6) {
      return { error: 'Password minimal 6 karakter' }
    }

    // Verify current password
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })

    if (!currentUser?.password) {
      return { error: 'User tidak ditemukan' }
    }

    const isValidPassword = await bcrypt.compare(currentPassword, currentUser.password)
    if (!isValidPassword) {
      return { error: 'Password saat ini salah' }
    }
  }

  // Check if email is being changed and if it's already taken
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })

  if (currentUser?.email !== email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: session.user.id },
      },
    })

    if (existingUser) {
      return { error: 'Email sudah digunakan user lain' }
    }
  }

  // Prepare update data
  const updateData: any = {
    name,
    email,
  }

  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 10)
  }

  if (removeAvatar === 'true') {
    updateData.image = null
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  })

  revalidatePath('/profile')
  revalidatePath('/')
  return { success: true }
}

async function uploadAvatarAction(formData: FormData) {
  'use server'

  const session = await auth()
  if (!session?.user) {
    return { error: 'Unauthorized' }
  }

  const file = formData.get('avatar') as File

  if (!file) {
    return { error: 'Tidak ada file yang diupload' }
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { error: 'Hanya file gambar yang diperbolehkan' }
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { error: 'Ukuran file maksimal 2MB' }
  }

  try {
    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    // Update user with avatar URL
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: base64 },
    })

    revalidatePath('/profile')
    revalidatePath('/')

    return { success: true, image: base64 }
  } catch (error) {
    console.error('Avatar upload error:', error)
    return { error: 'Gagal mengupload avatar' }
  }
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const user = await getProfile()
  const params = await searchParams
  const showSuccess = params.success === 'true'

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h1>Profil Saya</h1>
            <p>Kelola informasi profil dan keamanan akun Anda</p>
          </div>
        </header>

        <ProfileForm
          user={user}
          showSuccess={showSuccess}
          updateProfileAction={updateProfileAction}
          uploadAvatarAction={uploadAvatarAction}
        />
      </main>
    </div>
  )
}
