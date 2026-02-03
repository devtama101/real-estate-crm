'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { LeadStatus, LeadSource } from '@prisma/client'
import { auth } from '@/lib/auth'

const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  budgetDisplay: z.string().optional(),
  propertyType: z.string().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  minSize: z.number().optional(),
  preferredAreas: z.array(z.string()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  assignedToId: z.string().optional(),
})

export async function getLeads(filters?: {
  status?: LeadStatus
  source?: LeadSource
  search?: string
  assignedToId?: string
}) {
  const session = await auth()
  const where: any = {}

  // If user is not admin, only show their leads
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    // If agent, filter by their own ID unless explicitly viewing all
    if (user?.role !== 'ADMIN') {
      where.assignedToId = session.user.id
    }
  }

  // Admin can filter by specific agent
  if (filters?.assignedToId) {
    where.assignedToId = filters.assignedToId
  }

  if (filters?.status) where.status = filters.status
  if (filters?.source) where.source = filters.source
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return leads.map((l) => ({
    ...l,
    budgetMin: l.budgetMin ? Number(l.budgetMin) : null,
    budgetMax: l.budgetMax ? Number(l.budgetMax) : null,
  }))
}

export async function getCurrentUserRole() {
  const session = await auth()
  if (!session?.user) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true, name: true },
  })

  return user
}

export async function getAllAgents() {
  const agents = await prisma.user.findMany({
    where: { role: 'AGENT' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })

  return agents
}

export async function getLead(id: string) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: true,
      activities: {
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      appointments: {
        include: { property: true },
        orderBy: { startTime: 'desc' },
      },
    },
  })

  if (!lead) return null

  return {
    ...lead,
    budgetMin: lead.budgetMin ? Number(lead.budgetMin) : null,
    budgetMax: lead.budgetMax ? Number(lead.budgetMax) : null,
  }
}

export async function createLead(formData: FormData) {
  const session = await auth()
  const data = leadSchema.parse(Object.fromEntries(formData))

  const lead = await prisma.lead.create({
    data: {
      ...data,
      status: data.status || LeadStatus.NEW,
      source: data.source || LeadSource.WEBSITE,
    },
  })

  // Log activity
  if (session?.user?.id) {
    await prisma.activity.create({
      data: {
        type: 'STATUS_CHANGE',
        description: `New lead created: ${lead.name}`,
        leadId: lead.id,
        createdById: session.user.id,
      },
    })
  }

  revalidatePath('/leads')
  revalidatePath('/dashboard')
  redirect('/leads')
}

export async function updateLead(id: string, formData: FormData) {
  const data = leadSchema.parse(Object.fromEntries(formData))

  const lead = await prisma.lead.update({
    where: { id },
    data,
  })

  revalidatePath('/leads')
  revalidatePath(`/leads/${id}`)
  return lead
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const session = await auth()
  const lead = await prisma.lead.update({
    where: { id },
    data: { status },
  })

  // Log activity
  if (session?.user?.id) {
    await prisma.activity.create({
      data: {
        type: 'STATUS_CHANGE',
        description: `Status changed to ${status}`,
        leadId: id,
        createdById: session.user.id,
      },
    })
  }

  revalidatePath('/leads')
  revalidatePath(`/leads/${id}`)
  revalidatePath('/pipeline')
  return lead
}

export async function deleteLead(id: string) {
  await prisma.lead.delete({
    where: { id },
  })

  revalidatePath('/leads')
  revalidatePath('/dashboard')
}

export async function getPipelineData() {
  const leads = await prisma.lead.findMany({
    where: {
      status: { in: [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.VIEWING, LeadStatus.NEGOTIATION] },
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return leads.map((l) => ({
    ...l,
    budgetMin: l.budgetMin ? Number(l.budgetMin) : null,
    budgetMax: l.budgetMax ? Number(l.budgetMax) : null,
  }))
}

export async function addLeadNote(leadId: string, note: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const activity = await prisma.activity.create({
    data: {
      type: 'NOTE',
      description: note,
      leadId,
      createdById: session.user.id,
    },
  })

  revalidatePath(`/leads/${leadId}`)
  return activity
}
