'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CommissionStatus } from '@prisma/client'

export async function getCommissions(filters?: {
  agentId?: string
  status?: CommissionStatus
  startDate?: Date
  endDate?: Date
}) {
  const where: any = {}

  if (filters?.agentId) where.agentId = filters.agentId
  if (filters?.status) where.status = filters.status
  if (filters?.startDate || filters?.endDate) {
    where.closedDate = {}
    if (filters.startDate) where.closedDate.gte = filters.startDate
    if (filters.endDate) where.closedDate.lte = filters.endDate
  }

  const commissions = await prisma.commission.findMany({
    where,
    include: {
      agent: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, title: true, address: true } },
    },
    orderBy: { closedDate: 'desc' },
  })

  return commissions
}

export async function getCommission(id: string) {
  const commission = await prisma.commission.findUnique({
    where: { id },
    include: {
      agent: true,
      property: true,
    },
  })

  return commission
}

export async function getCommissionSummary(agentId?: string) {
  const where: any = {}
  if (agentId) where.agentId = agentId

  const [
    totalPending,
    totalApproved,
    totalPaid,
    totalEarned,
  ] = await Promise.all([
    prisma.commission.aggregate({
      where: { ...where, status: CommissionStatus.PENDING },
      _sum: { commissionAmount: true },
    }),
    prisma.commission.aggregate({
      where: { ...where, status: CommissionStatus.APPROVED },
      _sum: { commissionAmount: true },
    }),
    prisma.commission.aggregate({
      where: { ...where, status: CommissionStatus.PAID },
      _sum: { commissionAmount: true },
    }),
    prisma.commission.aggregate({
      where,
      _sum: { commissionAmount: true },
    }),
  ])

  const closedDeals = await prisma.commission.count({
    where: { ...where, status: { in: [CommissionStatus.PAID, CommissionStatus.APPROVED] } },
  })

  return {
    pending: Number(totalPending._sum.commissionAmount || 0),
    approved: Number(totalApproved._sum.commissionAmount || 0),
    paid: Number(totalPaid._sum.commissionAmount || 0),
    total: Number(totalEarned._sum.commissionAmount || 0),
    closedDeals,
  }
}

export async function createCommission(data: {
  propertyId: string
  agentId: string
  dealValue: number
  commissionRate: number
  splitPercentage?: number
}) {
  const commissionAmount = Math.round(data.dealValue * data.commissionRate)
  const splitAmount = data.splitPercentage
    ? Math.round(commissionAmount * (data.splitPercentage / 100))
    : null

  const commission = await prisma.commission.create({
    data: {
      propertyId: data.propertyId,
      agentId: data.agentId,
      dealValue: data.dealValue,
      commissionRate: data.commissionRate,
      commissionAmount,
      splitPercentage: data.splitPercentage,
      splitAmount,
      status: CommissionStatus.PENDING,
    },
  })

  revalidatePath('/commissions')
  return commission
}

export async function updateCommissionStatus(
  id: string,
  status: CommissionStatus,
  paidDate?: Date
) {
  // First get the commission to access commissionAmount
  const existing = await prisma.commission.findUnique({
    where: { id },
    select: { commissionAmount: true },
  })

  const commission = await prisma.commission.update({
    where: { id },
    data: {
      status,
      ...(paidDate && { paidDate }),
      ...(paidDate && existing && { paidAmount: existing.commissionAmount }),
    },
  })

  revalidatePath('/commissions')
  return commission
}

export async function getMonthlyCommissions(year?: number) {
  const currentYear = year || new Date().getFullYear()

  const commissions = await prisma.commission.findMany({
    where: {
      closedDate: {
        gte: new Date(currentYear, 0, 1),
        lte: new Date(currentYear, 11, 31),
      },
      status: { in: [CommissionStatus.PAID, CommissionStatus.APPROVED] },
    },
    select: {
      closedDate: true,
      commissionAmount: true,
    },
  })

  const monthly = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    amount: 0,
  }))

  commissions.forEach((c) => {
    const month = new Date(c.closedDate).getMonth()
    monthly[month].amount += Number(c.commissionAmount)
  })

  return monthly
}
