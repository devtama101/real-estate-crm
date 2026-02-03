import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
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
  const file = formData.get('avatar') as File

  if (!file) {
    return NextResponse.json({ error: 'Tidak ada file yang diupload' }, { status: 400 })
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Hanya file gambar yang diperbolehkan' }, { status: 400 })
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Ukuran file maksimal 2MB' }, { status: 400 })
  }

  try {
    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    // Update user with avatar URL
    await prisma.user.update({
      where: { id: userId },
      data: { image: base64 },
    })

    return NextResponse.json({ success: true, image: base64 })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Gagal mengupload avatar' }, { status: 500 })
  }
}
