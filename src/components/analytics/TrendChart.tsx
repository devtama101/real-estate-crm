'use client'

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface TrendChartProps {
  data: {
    month: string
    agentName: string
    deals: number
  }[]
  topAgents?: number
}

export function TrendChart({ data, topAgents = 5 }: TrendChartProps) {
  // Get unique months
  const months = [...new Set(data.map((d) => d.month))].sort()

  // Get top agents by total deals
  const agentTotals = data.reduce((acc, curr) => {
    acc[curr.agentName] = (acc[curr.agentName] || 0) + curr.deals
    return acc
  }, {} as Record<string, number>)

  const topAgentNames = Object.entries(agentTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topAgents)
    .map(([name]) => name)

  // Filter data to only include top agents
  const filteredData = data.filter((d) => topAgentNames.includes(d.agentName))

  // Transform data for chart
  const chartData = months.map((month) => {
    const monthData: any = { month }
    topAgentNames.forEach((agentName) => {
      const entry = filteredData.find((d) => d.month === month && d.agentName === agentName)
      const shortName = agentName.split(' ')[0]
      monthData[shortName] = entry?.deals || 0
    })
    return monthData
  })

  const colors = [
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
  ]

  const shortNames = topAgentNames.map((name) => name.split(' ')[0])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11 }}
          stroke="#6b7280"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
        />
        {shortNames.map((name, index) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
