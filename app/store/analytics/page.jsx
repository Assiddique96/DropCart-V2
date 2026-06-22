'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { getStoreAuthHeaders } from "@/lib/storeAuthHeaders"
import {
  TrendingUpIcon, PackageIcon, StarIcon, BarChart2Icon,
  ShoppingBagIcon, RefreshCwIcon, AlertCircleIcon,
  ArrowUpIcon, ArrowDownIcon, UsersIcon
} from "lucide-react"

const PERIODS = [
  { label: "7 days",  value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
]

function safeN(v) { const n = Number(v); return Number.isFinite(n) ? n : 0 }

function MiniBar({ data = [], height = 48 }) {
  if (!data.length) return <div className="text-xs text-slate-400">No data</div>
  const max = Math.max(...data.map(d => d.total), 1)
  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
          <div
            className="w-full rounded-sm bg-slate-800 dark:bg-slate-300 opacity-80 group-hover:opacity-100 transition-all"
            style={{ height: `${Math.max(2, (d.total / max) * height)}px` }}
            title={`${d.date}: ₦${safeN(d.total).toLocaleString()}`}
          />
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub, icon: Icon, trend, color = "text-slate-800 dark:text-slate-100" }) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-900 flex items-start gap-4">
      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
        <Icon size={18} className="text-slate-600 dark:text-slate-300" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className={`text-xl font-bold truncate ${color}`}>{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <p className={`text-[11px] flex items-center gap-0.5 mt-0.5 font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {trend >= 0 ? <ArrowUpIcon size={11} /> : <ArrowDownIcon size={11} />}
            {Math.abs(trend)}% vs prev period
          </p>
        )}
      </div>
    </div>
  )
}

export default function StoreAnalytics() {
  const { getToken } = useAuth()
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'
  const [period, setPeriod] = useState("30")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = await getStoreAuthHeaders(getToken)
      const { data: res } = await axios.get(`/api/store/dashboard?period=${period}`, { headers })
      setData(res)
    } catch (e) {
      setError(e?.response?.data?.error || e.message)
      toast.error("Failed to load analytics")
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [period])

  if (loading) return <Loading />

  if (error) {
    return (
      <div className="text-slate-500 dark:text-slate-300 mb-28">
        <h1 className="text-2xl mb-6">Store <span className="text-slate-800 dark:text-slate-100 font-medium">Analytics</span></h1>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-12 text-center gap-4">
          <AlertCircleIcon size={32} className="text-red-400" />
          <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
          <button onClick={fetchData} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition">
            <RefreshCwIcon size={14} /> Retry
          </button>
        </div>
      </div>
    )
  }

  const d = data || {}
  const totalRevenue = safeN(d.totalEarnings)
  const paidRevenue  = safeN(d.paidEarnings)
  const totalOrders  = safeN(d.totalOrders)
  const avgRating    = safeN(d.averageRating)
  const totalProducts = safeN(d.totalProducts)
  const statusBreakdown = d.statusBreakdown || {}
  const revenueChart = d.revenueChart || []
  const topProducts  = d.topProducts || []
  const recentReviews = d.recentReviews || []
  const conversionRate = totalOrders > 0 && d.totalVisitors > 0
    ? ((totalOrders / d.totalVisitors) * 100).toFixed(1)
    : null

  const delivered  = safeN(statusBreakdown.DELIVERED)
  const cancelled  = safeN(statusBreakdown.CANCELLED)
  const processing = safeN(statusBreakdown.PROCESSING) + safeN(statusBreakdown.ORDER_PLACED)
  const shipped    = safeN(statusBreakdown.SHIPPED)

  const statusItems = [
    { label: "Processing", count: processing, color: "bg-amber-400" },
    { label: "Shipped",    count: shipped,    color: "bg-blue-400" },
    { label: "Delivered",  count: delivered,  color: "bg-green-500" },
    { label: "Cancelled",  count: cancelled,  color: "bg-red-400" },
  ]

  const fulfillmentRate = totalOrders > 0
    ? Math.round((delivered / totalOrders) * 100)
    : 0

  return (
    <div className="text-slate-500 dark:text-slate-300 mb-28 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl">Store <span className="text-slate-800 dark:text-slate-100 font-medium">Analytics</span></h1>
          <p className="text-xs text-slate-400 mt-0.5">Performance overview for your store</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition ${
                  period === p.value
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
            <RefreshCwIcon size={14} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`${currency}${totalRevenue.toLocaleString()}`}
          sub={`${currency}${paidRevenue.toLocaleString()} paid`}
          icon={TrendingUpIcon}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Total Orders"
          value={totalOrders.toLocaleString()}
          sub={`${fulfillmentRate}% fulfillment rate`}
          icon={ShoppingBagIcon}
        />
        <StatCard
          label="Products Listed"
          value={totalProducts.toLocaleString()}
          sub={`${safeN(d.inStockCount)} in stock`}
          icon={PackageIcon}
        />
        <StatCard
          label="Avg. Rating"
          value={avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "—"}
          sub={`${safeN(d.totalReviews)} reviews`}
          icon={StarIcon}
          color={avgRating >= 4 ? 'text-amber-500' : avgRating >= 3 ? 'text-slate-800 dark:text-slate-100' : 'text-red-500'}
        />
      </div>

      {/* Revenue chart + Order status */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue sparkline */}
        <div className="lg:col-span-2 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <BarChart2Icon size={15} /> Revenue — last {period} days
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{revenueChart.length} data points</p>
            </div>
            {revenueChart.length > 0 && (
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {currency}{revenueChart.reduce((s, d) => s + safeN(d.total), 0).toLocaleString()}
              </p>
            )}
          </div>
          {revenueChart.length > 0 ? (
            <MiniBar data={revenueChart} height={80} />
          ) : (
            <div className="flex items-center justify-center h-20 text-slate-400 text-sm">
              No revenue data for this period
            </div>
          )}
          {revenueChart.length > 0 && (
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
              <span>{revenueChart[0]?.date}</span>
              <span>{revenueChart[revenueChart.length - 1]?.date}</span>
            </div>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <PackageIcon size={15} /> Order breakdown
          </p>
          <div className="space-y-3">
            {statusItems.map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300">{s.label}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{s.count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.color}`}
                    style={{ width: totalOrders > 0 ? `${(s.count / totalOrders) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fulfillment rate:
              <span className={`ml-1 font-bold ${fulfillmentRate >= 70 ? 'text-green-600 dark:text-green-400' : fulfillmentRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                {fulfillmentRate}%
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Top products + Recent reviews */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUpIcon size={15} /> Top products by orders
          </p>
          {topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">No product data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4 shrink-0">#{i + 1}</span>
                  {p.image && (
                    <img src={p.image} alt="" className="w-8 h-8 rounded object-cover border border-slate-100 dark:border-slate-800 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400">{p.orderCount} orders · {currency}{safeN(p.revenue).toLocaleString()}</p>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0">
                    {currency}{safeN(p.price).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent reviews */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <StarIcon size={15} /> Recent reviews
          </p>
          {recentReviews.length === 0 ? (
            <p className="text-sm text-slate-400">No reviews yet.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {recentReviews.map(r => (
                <div key={r.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate max-w-[140px]">{r.user?.name ?? "Anonymous"}</p>
                    <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-[11px] ${i < r.rating ? 'opacity-100' : 'opacity-25'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{r.review}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{r.product?.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Avg order value + repeat customer rate */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-400 mb-1">Avg Order Value</p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {totalOrders > 0 ? `${currency}${Math.round(totalRevenue / totalOrders).toLocaleString()}` : '—'}
          </p>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-400 mb-1">Cancellation Rate</p>
          <p className={`text-xl font-bold ${cancelled > 0 && totalOrders > 0 && (cancelled/totalOrders) > 0.2 ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>
            {totalOrders > 0 ? `${Math.round((cancelled / totalOrders) * 100)}%` : '—'}
          </p>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-400 mb-1">Total Reviews</p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {safeN(d.totalReviews).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">
            {avgRating > 0 ? `${avgRating.toFixed(1)} avg ★` : 'No ratings yet'}
          </p>
        </div>
      </div>
    </div>
  )
}
