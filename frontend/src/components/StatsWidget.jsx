/**
 * components/StatsWidget.jsx
 * Bar chart showing daily access counts for the past 7 days.
 * Uses Recharts for visualization.
 */

import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'
import { subDays, format } from 'date-fns'
import apiClient from '../api/apiClient.js'

// Generate data for the past 7 days
const getLast7Days = () =>
  Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'dd/MM') }
  })

const fetchDailyStats = async () => {
  const days = getLast7Days()
  // Fetch stats for each day in parallel
  const results = await Promise.all(
    days.map(async ({ date, label }) => {
      try {
        const params = new URLSearchParams({ date, limit: 1 })
        const { data } = await apiClient.get(`/access-logs?${params}`)
        // We only need the total for the day — use count endpoint if available
        // For now use the total from the list response
        return { label, total: data.total, date }
      } catch {
        return { label, total: 0, date }
      }
    })
  )
  return results
}

const fetchAccessStats = async () => {
  const { data } = await apiClient.get('/access-logs/stats')
  return data
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

export default function StatsWidget() {
  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['daily-stats-chart'],
    queryFn: fetchDailyStats,
    staleTime: 5 * 60_000,
  })

  if (isLoading) {
    return (
      <div className="h-48 bg-gray-800/50 rounded-xl animate-pulse flex items-center justify-center">
        <p className="text-gray-600 text-sm">Loading chart...</p>
      </div>
    )
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1f2937"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar
            dataKey="total"
            name="Access Events"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
