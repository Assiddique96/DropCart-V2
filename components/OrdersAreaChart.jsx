'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function OrdersAreaChart({ allOrders }) {

    const safeOrders = Array.isArray(allOrders) ? allOrders : []

    const toISODate = (d) => {
        const t = new Date(d)
        if (Number.isNaN(t.getTime())) return null
        return t.toISOString().split('T')[0]
    }

    // Group orders by date (YYYY-MM-DD)
    const ordersPerDay = safeOrders.reduce((acc, order) => {
        const date = toISODate(order?.createdAt)
        if (!date) return acc
        acc[date] = (acc[date] || 0) + 1
        return acc
    }, {})

    const dates = Object.keys(ordersPerDay).sort()

    // Fill missing days so the chart reads as a timeline
    const chartData = (() => {
        if (dates.length === 0) return []

        const start = new Date(dates[0])
        const end = new Date(dates[dates.length - 1])
        const out = []

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split('T')[0]
            out.push({ date: key, orders: ordersPerDay[key] || 0 })
        }
        return out
    })()

    const formatTick = (iso) => {
        try {
            return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })
        } catch {
            return iso
        }
    }

    const tooltipLabel = (iso) => {
        try {
            return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })
        } catch {
            return iso
        }
    }

    return (
        <div className="w-full max-w-5xl h-[320px] text-xs">
            <div className="flex items-end justify-between gap-4 mb-4 pt-2">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Orders <span className="text-slate-500 dark:text-slate-400 font-medium">/ Day</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                        {chartData.length ? `${chartData.length} days shown` : 'No data'}
                    </p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height="100%"> 
                <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatTick}
                        minTickGap={20}
                        tick={{ fill: 'rgba(100,116,139,1)', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                        tickLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fill: 'rgba(100,116,139,1)', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                        tickLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                    />
                    <Tooltip
                        labelFormatter={tooltipLabel}
                        formatter={(value) => [value, 'Orders']}
                        contentStyle={{
                            borderRadius: 12,
                            border: '1px solid rgba(148,163,184,0.25)',
                            background: 'rgba(255,255,255,0.95)',
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="#4f46e5"
                        fill="rgba(79,70,229,0.20)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
