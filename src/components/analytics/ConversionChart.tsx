'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

interface ConversionChartProps {
  data: {
    agentName: string
    conversionRate: number
    totalLeads: number
  }[]
  teamAverage?: number
}

export function ConversionChart({ data, teamAverage }: ConversionChartProps) {
  const chartData = data
    .filter((d) => d.totalLeads >= 3) // Only agents with meaningful data
    .map((d) => ({
      name: d.agentName.split(' ')[0],
      fullName: d.agentName,
      conversion: d.conversionRate,
      leads: d.totalLeads,
    }))
    .sort((a, b) => b.conversion - a.conversion)

  // Color based on performance
  const getBarColor = (value: number, avg?: number) => {
    if (!avg) return '#3b82f6'
    if (value >= avg + 10) return '#10b981' // green-500
    if (value >= avg - 5) return '#3b82f6' // blue-500
    return '#f59e0b' // amber-500
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <Tooltip
          formatter={(value: number | undefined, name: string | undefined) => {
            if (name === 'conversion') return [`${value ?? 0}%`, 'Konversi']
            return [value ?? 0, name ?? '']
          }}
          labelFormatter={(label) => {
            const entry = chartData.find((d) => d.name === label)
            return `${entry?.fullName || label} (${entry?.leads || 0} leads)`
          }}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        {teamAverage && (
          <ReferenceLine
            y={teamAverage}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{ value: `Rata-rata: ${teamAverage.toFixed(1)}%`, position: 'right', fill: '#ef4444', fontSize: 12 }}
          />
        )}
        <Bar dataKey="conversion" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.conversion, teamAverage)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
