'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { LeadStatus, CommissionStatus, ActivityType } from '@prisma/client'
import { redirect } from 'next/navigation'

export type Period = 'month' | 'quarter' | 'year' | 'all'
export type LeaderboardMetric = 'revenue' | 'deals' | 'conversion'

interface DateRange {
  startDate: Date
  endDate: Date
}

function getDateRange(period: Period, customStart?: Date, customEnd?: Date): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd }
  }

  switch (period) {
    case 'month':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      }
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      return {
        startDate: new Date(now.getFullYear(), quarter * 3, 1),
        endDate: new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59),
      }
    case 'year':
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      }
    case 'all':
      return {
        startDate: new Date(2020, 0, 1),
        endDate: today,
      }
    default:
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: today,
      }
  }
}

async function checkAdminAccess() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return session
}

export interface AgentPerformanceData {
  agentId: string
  agentName: string
  agentEmail: string
  totalLeads: number
  newLeads: number
  contactedLeads: number
  viewingLeads: number
  negotiationLeads: number
  closedDeals: number
  lostDeals: number
  conversionRate: number
  totalRevenue: number
  avgDaysToClose: number
  totalCommission: number
  activitiesCount: number
  appointmentsCount: number
}

export async function getAgentPerformance(
  period: Period = 'month',
  customStart?: Date,
  customEnd?: Date
): Promise<AgentPerformanceData[]> {
  await checkAdminAccess()

  const { startDate, endDate } = getDateRange(period, customStart, customEnd)

  // Get all agents
  const agents = await prisma.user.findMany({
    where: { role: 'AGENT' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })

  // Get performance data for each agent
  const performanceData = await Promise.all(
    agents.map(async (agent) => {
      // Get leads in period
      const leads = await prisma.lead.findMany({
        where: {
          assignedToId: agent.id,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          source: true,
        },
      })

      // Get closed deals with commissions
      const closedLeads = await prisma.lead.findMany({
        where: {
          assignedToId: agent.id,
          status: LeadStatus.CLOSED,
          updatedAt: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      // Get commissions for this agent in period
      const commissions = await prisma.commission.findMany({
        where: {
          agentId: agent.id,
          closedDate: { gte: startDate, lte: endDate },
          status: { in: [CommissionStatus.PAID, CommissionStatus.APPROVED] },
        },
        select: {
          commissionAmount: true,
          closedDate: true,
        },
      })

      // Get activities count
      const activitiesCount = await prisma.activity.count({
        where: {
          createdById: agent.id,
          createdAt: { gte: startDate, lte: endDate },
        },
      })

      // Get appointments count
      const appointmentsCount = await prisma.appointment.count({
        where: {
          createdById: agent.id,
          startTime: { gte: startDate, lte: endDate },
        },
      })

      // Calculate metrics
      const totalLeads = leads.length
      const newLeads = leads.filter((l) => l.status === LeadStatus.NEW).length
      const contactedLeads = leads.filter((l) => l.status === LeadStatus.CONTACTED).length
      const viewingLeads = leads.filter((l) => l.status === LeadStatus.VIEWING).length
      const negotiationLeads = leads.filter((l) => l.status === LeadStatus.NEGOTIATION).length
      const closedDeals = closedLeads.length
      const lostLeads = leads.filter((l) => l.status === LeadStatus.LOST).length

      // Conversion rate
      const conversionRate = totalLeads > 0 ? (closedDeals / totalLeads) * 100 : 0

      // Total revenue (deal values from commissions)
      const totalRevenue = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)

      // Commission amount (sum of commissionAmount)
      const totalCommission = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)

      // Average days to close
      let avgDaysToClose = 0
      if (closedDeals > 0) {
        const totalDays = closedLeads.reduce((sum, lead) => {
          const days = Math.floor((lead.updatedAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          return sum + days
        }, 0)
        avgDaysToClose = Math.round(totalDays / closedDeals)
      }

      return {
        agentId: agent.id,
        agentName: agent.name || 'Unknown',
        agentEmail: agent.email || '',
        totalLeads,
        newLeads,
        contactedLeads,
        viewingLeads,
        negotiationLeads,
        closedDeals,
        lostDeals: lostLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        totalRevenue,
        avgDaysToClose,
        totalCommission,
        activitiesCount,
        appointmentsCount,
      }
    })
  )

  return performanceData
}

export interface TeamOverviewData {
  totalLeads: number
  totalClosed: number
  teamConversionRate: number
  totalRevenue: number
  totalCommission: number
  activeDeals: number
  avgDaysToClose: number
  newLeadsThisPeriod: number
}

export async function getTeamOverview(
  period: Period = 'month',
  customStart?: Date,
  customEnd?: Date
): Promise<TeamOverviewData> {
  await checkAdminAccess()

  const { startDate, endDate } = getDateRange(period, customStart, customEnd)

  const [totalLeads, closedLeads, activeLeads, newLeads, commissions] = await Promise.all([
    // Total leads in period
    prisma.lead.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    // Closed leads in period
    prisma.lead.findMany({
      where: {
        status: LeadStatus.CLOSED,
        updatedAt: { gte: startDate, lte: endDate },
      },
      select: { id: true, createdAt: true, updatedAt: true },
    }),
    // Active deals (viewing + negotiation)
    prisma.lead.count({
      where: {
        status: { in: [LeadStatus.VIEWING, LeadStatus.NEGOTIATION] },
      },
    }),
    // New leads this period
    prisma.lead.count({
      where: {
        status: LeadStatus.NEW,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    // Commissions in period
    prisma.commission.findMany({
      where: {
        closedDate: { gte: startDate, lte: endDate },
        status: { in: [CommissionStatus.PAID, CommissionStatus.APPROVED] },
      },
      select: { commissionAmount: true, dealValue: true },
    }),
  ])

  const totalClosed = closedLeads.length
  const teamConversionRate = totalLeads > 0 ? (totalClosed / totalLeads) * 100 : 0
  const totalRevenue = commissions.reduce((sum, c) => sum + Number(c.dealValue), 0)
  const totalCommission = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)

  // Average days to close
  let avgDaysToClose = 0
  if (totalClosed > 0) {
    const totalDays = closedLeads.reduce((sum, lead) => {
      const days = Math.floor((lead.updatedAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)
    avgDaysToClose = Math.round(totalDays / totalClosed)
  }

  return {
    totalLeads,
    totalClosed,
    teamConversionRate: Math.round(teamConversionRate * 10) / 10,
    totalRevenue,
    totalCommission,
    activeDeals: activeLeads,
    avgDaysToClose,
    newLeadsThisPeriod: newLeads,
  }
}

export interface LeaderboardEntry {
  rank: number
  agentId: string
  agentName: string
  value: number
  metric: LeaderboardMetric
}

export async function getLeaderboard(
  metric: LeaderboardMetric = 'revenue',
  period: Period = 'month',
  customStart?: Date,
  customEnd?: Date
): Promise<LeaderboardEntry[]> {
  await checkAdminAccess()

  const performance = await getAgentPerformance(period, customStart, customEnd)

  let leaderboard: LeaderboardEntry[] = []

  switch (metric) {
    case 'revenue':
      leaderboard = performance
        .map((p) => ({
          rank: 0,
          agentId: p.agentId,
          agentName: p.agentName,
          value: p.totalCommission,
          metric,
        }))
        .sort((a, b) => b.value - a.value)
      break
    case 'deals':
      leaderboard = performance
        .map((p) => ({
          rank: 0,
          agentId: p.agentId,
          agentName: p.agentName,
          value: p.closedDeals,
          metric,
        }))
        .sort((a, b) => b.value - a.value)
      break
    case 'conversion':
      leaderboard = performance
        .filter((p) => p.totalLeads >= 3) // Only agents with at least 3 leads
        .map((p) => ({
          rank: 0,
          agentId: p.agentId,
          agentName: p.agentName,
          value: p.conversionRate,
          metric,
        }))
        .sort((a, b) => b.value - a.value)
      break
  }

  // Assign ranks
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1
  })

  return leaderboard
}

export interface AgentDetailData {
  agent: {
    id: string
    name: string
    email: string
  }
  currentPeriod: AgentPerformanceData
  previousPeriod: AgentPerformanceData | null
  funnelBreakdown: FunnelStage[]
  activityBreakdown: ActivityBreakdown[]
  bestSources: SourcePerformance[]
  closedDeals: ClosedDeal[]
  comparisonWithTeam: {
    conversionRateDiff: number
    revenueDiff: number
    dealsDiff: number
  }
}

export interface FunnelStage {
  stage: string
  count: number
  percentage: number
}

export interface ActivityBreakdown {
  type: string
  count: number
}

export interface SourcePerformance {
  source: string
  leads: number
  closed: number
  conversionRate: number
}

export interface ClosedDeal {
  id: string
  leadName: string
  propertyTitle: string
  dealValue: number
  commissionAmount: number
  closedDate: Date
  daysToClose: number
}

export async function getAgentDetail(
  agentId: string,
  period: Period = 'month',
  customStart?: Date,
  customEnd?: Date
): Promise<AgentDetailData | null> {
  await checkAdminAccess()

  // Get agent
  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    select: { id: true, name: true, email: true, role: true },
  })

  if (!agent || agent.role !== 'AGENT') {
    return null
  }

  const { startDate, endDate } = getDateRange(period, customStart, customEnd)

  // Calculate previous period for comparison
  let prevStartDate: Date
  let prevEndDate: Date
  const periodLength = endDate.getTime() - startDate.getTime()

  prevEndDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
  prevStartDate = new Date(prevEndDate.getTime() - periodLength)

  // Get current period performance
  const currentPeriodData = await getAgentPerformanceForDates(agentId, startDate, endDate)

  // Get previous period performance
  const previousPeriodData = await getAgentPerformanceForDates(agentId, prevStartDate, prevEndDate)

  // Get funnel breakdown
  const funnelBreakdown = await getFunnelBreakdown(agentId, startDate, endDate)

  // Get activity breakdown
  const activityBreakdown = await getActivityBreakdown(agentId, startDate, endDate)

  // Get best sources
  const bestSources = await getSourcePerformance(agentId, startDate, endDate)

  // Get closed deals
  const closedDeals = await getClosedDeals(agentId, startDate, endDate)

  // Get team averages for comparison
  const teamPerformance = await getAgentPerformance(period, customStart, customEnd)
  const teamAvgConversion = teamPerformance.reduce((sum, p) => sum + p.conversionRate, 0) / teamPerformance.length
  const teamAvgRevenue = teamPerformance.reduce((sum, p) => sum + p.totalCommission, 0) / teamPerformance.length
  const teamAvgDeals = teamPerformance.reduce((sum, p) => sum + p.closedDeals, 0) / teamPerformance.length

  const comparisonWithTeam = {
    conversionRateDiff: Math.round((currentPeriodData.conversionRate - teamAvgConversion) * 10) / 10,
    revenueDiff: Math.round(currentPeriodData.totalCommission - teamAvgRevenue),
    dealsDiff: Math.round((currentPeriodData.closedDeals - teamAvgDeals) * 10) / 10,
  }

  return {
    agent: {
      id: agent.id,
      name: agent.name || 'Unknown',
      email: agent.email || '',
    },
    currentPeriod: currentPeriodData,
    previousPeriod: previousPeriodData,
    funnelBreakdown,
    activityBreakdown,
    bestSources,
    closedDeals,
    comparisonWithTeam,
  }
}

async function getAgentPerformanceForDates(
  agentId: string,
  startDate: Date,
  endDate: Date
): Promise<AgentPerformanceData> {
  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    select: { id: true, name: true, email: true },
  })

  if (!agent) {
    throw new Error('Agent not found')
  }

  const leads = await prisma.lead.findMany({
    where: {
      assignedToId: agentId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      source: true,
    },
  })

  const closedLeads = await prisma.lead.findMany({
    where: {
      assignedToId: agentId,
      status: LeadStatus.CLOSED,
      updatedAt: { gte: startDate, lte: endDate },
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const commissions = await prisma.commission.findMany({
    where: {
      agentId,
      closedDate: { gte: startDate, lte: endDate },
      status: { in: [CommissionStatus.PAID, CommissionStatus.APPROVED] },
    },
    select: {
      commissionAmount: true,
    },
  })

  const [activitiesCount, appointmentsCount] = await Promise.all([
    prisma.activity.count({
      where: {
        createdById: agentId,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.appointment.count({
      where: {
        createdById: agentId,
        startTime: { gte: startDate, lte: endDate },
      },
    }),
  ])

  const totalLeads = leads.length
  const newLeads = leads.filter((l) => l.status === LeadStatus.NEW).length
  const contactedLeads = leads.filter((l) => l.status === LeadStatus.CONTACTED).length
  const viewingLeads = leads.filter((l) => l.status === LeadStatus.VIEWING).length
  const negotiationLeads = leads.filter((l) => l.status === LeadStatus.NEGOTIATION).length
  const closedDeals = closedLeads.length
  const lostLeads = leads.filter((l) => l.status === LeadStatus.LOST).length

  const conversionRate = totalLeads > 0 ? (closedDeals / totalLeads) * 100 : 0
  const totalCommission = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)

  let avgDaysToClose = 0
  if (closedDeals > 0) {
    const totalDays = closedLeads.reduce((sum, lead) => {
      const days = Math.floor((lead.updatedAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)
    avgDaysToClose = Math.round(totalDays / closedDeals)
  }

  return {
    agentId: agent.id,
    agentName: agent.name || 'Unknown',
    agentEmail: agent.email || '',
    totalLeads,
    newLeads,
    contactedLeads,
    viewingLeads,
    negotiationLeads,
    closedDeals,
    lostDeals: lostLeads,
    conversionRate: Math.round(conversionRate * 10) / 10,
    totalRevenue: totalCommission,
    avgDaysToClose,
    totalCommission,
    activitiesCount,
    appointmentsCount,
  }
}

async function getFunnelBreakdown(agentId: string, startDate: Date, endDate: Date): Promise<FunnelStage[]> {
  const leads = await prisma.lead.findMany({
    where: {
      assignedToId: agentId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { status: true },
  })

  const total = leads.length
  const stages = [
    { stage: 'Baru', status: LeadStatus.NEW },
    { stage: 'Dihubungi', status: LeadStatus.CONTACTED },
    { stage: 'Survei', status: LeadStatus.VIEWING },
    { stage: 'Negosiasi', status: LeadStatus.NEGOTIATION },
    { stage: 'Closing', status: LeadStatus.CLOSED },
    { stage: 'Batal', status: LeadStatus.LOST },
  ]

  return stages.map((s) => ({
    stage: s.stage,
    count: leads.filter((l) => l.status === s.status).length,
    percentage: total > 0 ? Math.round((leads.filter((l) => l.status === s.status).length / total) * 100) : 0,
  }))
}

async function getActivityBreakdown(agentId: string, startDate: Date, endDate: Date): Promise<ActivityBreakdown[]> {
  const activities = await prisma.activity.findMany({
    where: {
      createdById: agentId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { type: true },
  })

  const typeLabels: Record<ActivityType, string> = {
    CALL: 'Telepon',
    EMAIL: 'Email',
    SMS: 'SMS',
    MEETING: 'Meeting',
    NOTE: 'Catatan',
    STATUS_CHANGE: 'Ubah Status',
    VIEWING_SCHEDULED: 'Jadwal Survei',
    PROPERTY_MATCHED: 'Properti Cocok',
    EMAIL_SENT: 'Email Terkirim',
    REMINDER_SENT: 'Pengingat Terkirim',
  }

  const breakdown: Record<string, number> = {}
  activities.forEach((a) => {
    const label = typeLabels[a.type] || a.type
    breakdown[label] = (breakdown[label] || 0) + 1
  })

  return Object.entries(breakdown)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}

async function getSourcePerformance(agentId: string, startDate: Date, endDate: Date): Promise<SourcePerformance[]> {
  const leads = await prisma.lead.findMany({
    where: {
      assignedToId: agentId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { source: true, status: true },
  })

  const sourceLabels: Record<string, string> = {
    WEBSITE: 'Website',
    RUMAH123: 'Rumah123',
    LAMUDI: 'Lamudi',
    OLX: 'OLX',
    REFERRAL: 'Referral',
    OPEN_HOUSE: 'Open House',
    WALK_IN: 'Walk In',
    SOCIAL_MEDIA: 'Media Sosial',
    OTHER: 'Lainnya',
  }

  const sourceMap: Record<string, { leads: number; closed: number }> = {}

  leads.forEach((lead) => {
    const source = lead.source
    const label = sourceLabels[source] || source
    if (!sourceMap[label]) {
      sourceMap[label] = { leads: 0, closed: 0 }
    }
    sourceMap[label].leads++
    if (lead.status === LeadStatus.CLOSED) {
      sourceMap[label].closed++
    }
  })

  return Object.entries(sourceMap)
    .map(([source, data]) => ({
      source,
      leads: data.leads,
      closed: data.closed,
      conversionRate: data.leads > 0 ? Math.round((data.closed / data.leads) * 100) : 0,
    }))
    .filter((s) => s.leads > 0)
    .sort((a, b) => b.conversionRate - a.conversionRate)
}

async function getClosedDeals(agentId: string, startDate: Date, endDate: Date): Promise<ClosedDeal[]> {
  const closedLeads = await prisma.lead.findMany({
    where: {
      assignedToId: agentId,
      status: LeadStatus.CLOSED,
      updatedAt: { gte: startDate, lte: endDate },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const deals: ClosedDeal[] = []

  for (const lead of closedLeads) {
    // Find commission for this deal
    const commission = await prisma.commission.findFirst({
      where: {
        agentId,
        closedDate: { gte: startDate, lte: endDate },
      },
      include: {
        property: {
          select: { title: true },
        },
      },
      orderBy: { closedDate: 'desc' },
    })

    const daysToClose = Math.floor((lead.updatedAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24))

    deals.push({
      id: lead.id,
      leadName: lead.name,
      propertyTitle: commission?.property.title || 'N/A',
      dealValue: commission ? Number(commission.dealValue) : 0,
      commissionAmount: commission ? Number(commission.commissionAmount) : 0,
      closedDate: lead.updatedAt,
      daysToClose,
    })
  }

  return deals.sort((a, b) => b.closedDate.getTime() - a.closedDate.getTime())
}

export interface DealTrendData {
  month: string
  agentName: string
  deals: number
}

export async function getDealTrendsByAgent(
  period: Period = 'year',
  customStart?: Date,
  customEnd?: Date
): Promise<DealTrendData[]> {
  await checkAdminAccess()

  const { startDate, endDate } = getDateRange(period, customStart, customEnd)

  const agents = await prisma.user.findMany({
    where: { role: 'AGENT' },
    select: { id: true, name: true },
  })

  const trends: DealTrendData[] = []
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Generate month keys for the period
  const monthsInRange: string[] = []
  let current = new Date(startDate)
  while (current <= endDate) {
    monthsInRange.push(`${monthNames[current.getMonth()]} ${current.getFullYear()}`)
    current.setMonth(current.getMonth() + 1)
  }

  for (const agent of agents) {
    for (const month of monthsInRange) {
      const [monthName, year] = month.split(' ')
      const monthIndex = monthNames.indexOf(monthName)

      const closedDeals = await prisma.lead.count({
        where: {
          assignedToId: agent.id,
          status: LeadStatus.CLOSED,
          updatedAt: {
            gte: new Date(parseInt(year), monthIndex, 1),
            lte: new Date(parseInt(year), monthIndex + 1, 0, 23, 59, 59),
          },
        },
      })

      trends.push({
        month,
        agentName: agent.name || 'Unknown',
        deals: closedDeals,
      })
    }
  }

  return trends
}

export interface SourcePerformanceData {
  source: string
  leads: number
  closed: number
  conversionRate: number
  revenue: number
}

export async function getSourcePerformanceAll(
  period: Period = 'month',
  customStart?: Date,
  customEnd?: Date
): Promise<SourcePerformanceData[]> {
  await checkAdminAccess()

  const { startDate, endDate } = getDateRange(period, customStart, customEnd)

  const leads = await prisma.lead.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { source: true, status: true, id: true },
  })

  const sourceLabels: Record<string, string> = {
    WEBSITE: 'Website',
    RUMAH123: 'Rumah123',
    LAMUDI: 'Lamudi',
    OLX: 'OLX',
    REFERRAL: 'Referral',
    OPEN_HOUSE: 'Open House',
    WALK_IN: 'Walk In',
    SOCIAL_MEDIA: 'Media Sosial',
    OTHER: 'Lainnya',
  }

  const sourceMap: Record<string, { leads: number; closed: number; leadIds: string[] }> = {}

  leads.forEach((lead) => {
    const source = lead.source
    const label = sourceLabels[source] || source
    if (!sourceMap[label]) {
      sourceMap[label] = { leads: 0, closed: 0, leadIds: [] }
    }
    sourceMap[label].leads++
    sourceMap[label].leadIds.push(lead.id)
    if (lead.status === LeadStatus.CLOSED) {
      sourceMap[label].closed++
    }
  })

  const result: SourcePerformanceData[] = []

  for (const [source, data] of Object.entries(sourceMap)) {
    // Get revenue from commissions for these leads
    const commissions = await prisma.commission.findMany({
      where: {
        closedDate: { gte: startDate, lte: endDate },
      },
      select: { commissionAmount: true },
    })

    const revenue = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)

    result.push({
      source,
      leads: data.leads,
      closed: data.closed,
      conversionRate: data.leads > 0 ? Math.round((data.closed / data.leads) * 100) : 0,
      revenue,
    })
  }

  return result.sort((a, b) => b.revenue - a.revenue)
}

export interface PipelineVelocityData {
  agentId: string
  agentName: string
  avgDaysInNew: number
  avgDaysInContacted: number
  avgDaysInViewing: number
  avgDaysInNegotiation: number
  totalAvgDays: number
}

export async function getPipelineVelocity(
  period: Period = 'month',
  customStart?: Date,
  customEnd?: Date
): Promise<PipelineVelocityData[]> {
  await checkAdminAccess()

  const { startDate, endDate } = getDateRange(period, customStart, customEnd)

  const agents = await prisma.user.findMany({
    where: { role: 'AGENT' },
    select: { id: true, name: true },
  })

  const velocityData: PipelineVelocityData[] = []

  for (const agent of agents) {
    // Get closed leads in period to calculate their journey
    const closedLeads = await prisma.lead.findMany({
      where: {
        assignedToId: agent.id,
        status: LeadStatus.CLOSED,
        updatedAt: { gte: startDate, lte: endDate },
      },
      include: {
        activities: {
          where: {
            type: ActivityType.STATUS_CHANGE,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (closedLeads.length === 0) {
      velocityData.push({
        agentId: agent.id,
        agentName: agent.name || 'Unknown',
        avgDaysInNew: 0,
        avgDaysInContacted: 0,
        avgDaysInViewing: 0,
        avgDaysInNegotiation: 0,
        totalAvgDays: 0,
      })
      continue
    }

    let totalDaysInNew = 0
    let totalDaysInContacted = 0
    let totalDaysInViewing = 0
    let totalDaysInNegotiation = 0

    for (const lead of closedLeads) {
      const totalDays = Math.floor((lead.updatedAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      // Simple estimation - divide total days by number of stages passed
      // In a real system, you'd track actual status change timestamps
      const estimatedDaysPerStage = totalDays / 4
      totalDaysInNew += estimatedDaysPerStage
      totalDaysInContacted += estimatedDaysPerStage
      totalDaysInViewing += estimatedDaysPerStage
      totalDaysInNegotiation += estimatedDaysPerStage
    }

    const count = closedLeads.length

    velocityData.push({
      agentId: agent.id,
      agentName: agent.name || 'Unknown',
      avgDaysInNew: Math.round(totalDaysInNew / count),
      avgDaysInContacted: Math.round(totalDaysInContacted / count),
      avgDaysInViewing: Math.round(totalDaysInViewing / count),
      avgDaysInNegotiation: Math.round(totalDaysInNegotiation / count),
      totalAvgDays: Math.round((totalDaysInNew + totalDaysInContacted + totalDaysInViewing + totalDaysInNegotiation) / count),
    })
  }

  return velocityData.sort((a, b) => a.totalAvgDays - b.totalAvgDays)
}
