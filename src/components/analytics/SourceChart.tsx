'use client'

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatIDR } from '@/lib/constants'

interface SourceChartProps {
  data: {
    source: string
    leads: number
    closed: number
    conversionRate: number
    revenue: number
  }[]
}

const COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
]

export function SourceChart({ data }: SourceChartProps) {
  const chartData = data
    .filter((d) => d.leads > 0)
    .map((d) => ({
      name: d.source,
      value: d.leads,
      leads: d.leads,
      closed: d.closed,
      conversion: d.conversionRate,
      revenue: d.revenue,
    }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{data.name}</p>
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
            Leads: <span style={{ color: '#1f2937', fontWeight: 500 }}>{data.leads}</span>
          </p>
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
            Closing: <span style={{ color: '#10b981', fontWeight: 500 }}>{data.closed}</span>
          </p>
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
            Konversi: <span style={{ color: '#3b82f6', fontWeight: 500 }}>{data.conversion}%</span>
          </p>
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
            Revenue: <span style={{ color: '#10b981', fontWeight: 500 }}>{formatIDR(data.revenue)}</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        color: '#9ca3af',
      }}>
        Belum ada data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          wrapperStyle={{ fontSize: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
