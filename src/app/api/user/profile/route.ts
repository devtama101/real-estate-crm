import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
  // Get session using cookies
  const cookieHeader = request.headers.get('cookie') || ''
  const sessionRes = await fetch(`${process.env.NEXTAUTH_URL || request.nextUrl.origin}/api/auth/session`, {
    headers: { cookie: cookieHeader },
  })

  if (!sessionRes.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionData = await sessionRes.json()
  if (!sessionData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = sessionData.user.id

  const formData = await request.formData()
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const removeAvatar = formData.get('removeAvatar') as string

  if (!name || !email) {
    return NextResponse.json({ error: 'Nama dan email wajib diisi' }, { status: 400 })
  }

  // Check if user wants to change password
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Masukkan password saat ini untuk mengubah password' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Password baru tidak cocok' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    // Verify current password
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!currentUser?.password) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    const isValidPassword = await bcrypt.compare(currentPassword, currentUser.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Password saat ini salah' }, { status: 400 })
    }
  }

  // Check if email is being changed and if it's already taken
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  if (currentUser?.email !== email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId },
      },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah digunakan user lain' }, { status: 400 })
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
    where: { id: userId },
    data: updateData,
  })

  return NextResponse.json({ success: true })
}
