'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getActivities(leadId?: string) {
  const where: any = {}
  if (leadId) where.leadId = leadId

  const activities = await prisma.activity.findMany({
    where,
    include: {
      lead: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return activities
}

export async function getLeadActivities(leadId: string) {
  return getActivities(leadId)
}

export async function createActivity(data: {
  type: string
  description: string
  leadId?: string
  metadata?: any
}) {
  const activity = await prisma.activity.create({
    data: {
      type: data.type as any,
      description: data.description,
      leadId: data.leadId,
      createdById: 'system', // TODO: Get from session
      metadata: data.metadata,
    },
  })

  if (data.leadId) {
    revalidatePath('/leads')
    revalidatePath(`/leads/${data.leadId}`)
  }

  return activity
}

export async function deleteActivity(id: string) {
  const activity = await prisma.activity.findUnique({
    where: { id },
    select: { leadId: true },
  })

  await prisma.activity.delete({ where: { id } })

  if (activity?.leadId) {
    revalidatePath('/leads')
    revalidatePath(`/leads/${activity.leadId}`)
  }
}
