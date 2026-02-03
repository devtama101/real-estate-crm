'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface VelocityChartProps {
  data: {
    agentName: string
    avgDaysInNew: number
    avgDaysInContacted: number
    avgDaysInViewing: number
    avgDaysInNegotiation: number
    totalAvgDays: number
  }[]
  maxAgents?: number
}

export function VelocityChart({ data, maxAgents = 8 }: VelocityChartProps) {
  const chartData = data
    .filter((d) => d.totalAvgDays > 0)
    .slice(0, maxAgents)
    .map((d) => ({
      name: d.agentName.split(' ')[0],
      fullName: d.agentName,
      Baru: d.avgDaysInNew,
      Dihubungi: d.avgDaysInContacted,
      Survei: d.avgDaysInViewing,
      Negosiasi: d.avgDaysInNegotiation,
    }))

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
          label={{ value: 'Hari', angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <Tooltip
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
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        <Bar dataKey="Baru" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Dihubungi" fill="#8b5cf6" stackId="a" />
        <Bar dataKey="Survei" fill="#f59e0b" stackId="a" />
        <Bar dataKey="Negosiasi" fill="#10b981" stackId="a" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
