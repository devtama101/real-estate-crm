'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatIDR } from '@/lib/constants'

interface RevenueChartProps {
  data: {
    agentName: string
    totalCommission: number
  }[]
  maxBars?: number
}

export function RevenueChart({ data, maxBars = 10 }: RevenueChartProps) {
  // Sort by revenue and take top N
  const sortedData = [...data]
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, maxBars)

  // Reverse for horizontal bar chart display
  const chartData = sortedData.map((d) => ({
    name: d.agentName.split(' ')[0], // First name only
    fullName: d.agentName,
    revenue: d.totalCommission,
  })).reverse()

  // Generate colors
  const getBarColor = (index: number) => {
    const colors = [
      '#10b981', // emerald-500
      '#3b82f6', // blue-500
      '#8b5cf6', // violet-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#06b6d4', // cyan-500
      '#ec4899', // pink-500
      '#84cc16', // lime-500
    ]
    return colors[index % colors.length]
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="horizontal" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis
          type="number"
          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <Tooltip
          formatter={(value: number | undefined) => [formatIDR(value ?? 0), 'Komisi']}
          labelFormatter={(label) => {
            const entry = chartData.find((d) => d.name === label)
            return entry?.fullName || label
          }}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
