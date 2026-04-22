'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

const PALETTE = [
  "#4f46e5", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#ef4444", // red
  "#64748b", // slate
  "#14b8a6", // teal
]

export default function MadeInPieChart({ data }) {
  const rows = Array.isArray(data) ? data : []
  const total = rows.reduce((s, r) => s + (r.count || 0), 0)

  const chartData = rows.map((r, idx) => ({
    name: r.madeIn || "Unknown",
    value: Number(r.count || 0),
    color: PALETTE[idx % PALETTE.length],
  }))

  return (
    <div className="w-full h-[320px]">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Product made-in</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
            {total ? `${total.toLocaleString()} products` : "No data"}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
            stroke="rgba(255,255,255,0.3)"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              const pct = total ? Math.round((Number(value) / total) * 100) : 0
              return [`${Number(value).toLocaleString()} (${pct}%)`, name]
            }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.25)",
              background: "rgba(255,255,255,0.95)",
            }}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

