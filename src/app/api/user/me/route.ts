import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // Get session using cookies
  const cookieHeader = request.headers.get('cookie') || ''
  const sessionRes = await fetch(`${process.env.NEXTAUTH_URL || request.nextUrl.origin}/api/auth/session`, {
    headers: { cookie: cookieHeader },
  })

  if (!sessionRes.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionData = await sessionRes.json()
  if (!sessionData?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch fresh user data from database
  const user = await prisma.user.findUnique({
    where: { id: sessionData.user.id },
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
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user })
}
