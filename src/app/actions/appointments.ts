'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AppointmentType, AppointmentStatus } from '@prisma/client'

const appointmentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.nativeEnum(AppointmentType).optional(),
  leadId: z.string().optional(),
  propertyId: z.string().optional(),
})

export async function getAppointments(startDate?: Date, endDate?: Date) {
  const where: any = {}

  if (startDate && endDate) {
    where.startTime = {
      gte: startDate,
      lte: endDate,
    }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      lead: { select: { id: true, name: true, email: true, phone: true } },
      property: { select: { id: true, title: true, address: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  })

  return appointments
}

export async function getAppointment(id: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      lead: true,
      property: true,
      createdBy: true,
    },
  })

  return appointment
}

export async function createAppointment(formData: FormData) {
  const data = appointmentSchema.parse(Object.fromEntries(formData))

  const appointment = await prisma.appointment.create({
    data: {
      ...data,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      type: data.type || AppointmentType.VIEWING,
      status: AppointmentStatus.SCHEDULED,
      createdById: 'system', // TODO: Get from session
    },
  })

  // Log activity if associated with a lead
  if (appointment.leadId) {
    await prisma.activity.create({
      data: {
        type: 'VIEWING_SCHEDULED',
        description: `Viewing scheduled: ${appointment.title}`,
        leadId: appointment.leadId,
        createdById: 'system',
      },
    })
  }

  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  return appointment
}

export async function updateAppointment(id: string, formData: FormData) {
  const data = appointmentSchema.parse(Object.fromEntries(formData))

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      ...data,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
    },
  })

  revalidatePath('/calendar')
  revalidatePath(`/calendar`)
  return appointment
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status },
  })

  revalidatePath('/calendar')
  return appointment
}

export async function deleteAppointment(id: string) {
  await prisma.appointment.delete({
    where: { id },
  })

  revalidatePath('/calendar')
  revalidatePath('/dashboard')
}

export async function getUpcomingAppointments(daysAhead = 7) {
  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + daysAhead)

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: {
        gte: now,
        lte: future,
      },
      status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
    },
    include: {
      lead: { select: { id: true, name: true } },
      property: { select: { id: true, title: true, address: true } },
    },
    orderBy: { startTime: 'asc' },
  })

  return appointments
}
