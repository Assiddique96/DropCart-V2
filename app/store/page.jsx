'use client'
import Loading from "@/components/Loading"
import { CircleDollarSignIcon, ShoppingBasketIcon, StarIcon, TagsIcon, PackageCheckIcon, BanknoteIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { getStoreAuthHeaders } from "@/lib/storeAuthHeaders"

const STATUS_COLORS = {
    ORDER_PLACED: '#3b82f6',
    PROCESSING:   '#f59e0b',
    SHIPPED:      '#8b5cf6',
    DELIVERED:    '#22c55e',
    CANCELLED:    '#ef4444',
}

const PERIODS = [
    { label: '7 days',  value: '7' },
    { label: '30 days', value: '30' },
    { label: '90 days', value: '90' },
]

export default function Dashboard() {
    const { getToken } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('30')
    const [data, setData] = useState(null)

    const fetchDashboard = async () => {
        setLoading(true)
        try {
            const { data: res } = await axios.get(`/api/store/dashboard?period=${period}`, {
                headers: await getStoreAuthHeaders(getToken)
            })
            setData(res)
        } catch (e) {
            toast.error(e?.response?.data?.error || e.message)
        }
        setLoading(false)
    }

    useEffect(() => { fetchDashboard() }, [period])

    if (loading || !data) return <Loading />

    const summaryCards = [
        { title: 'Total Orders',    value: data.totalOrders,                              icon: TagsIcon,            color: 'text-blue-600 bg-blue-50' },
        { title: 'Total Earnings',  value: `${currency}${data.totalEarnings.toLocaleString()}`, icon: CircleDollarSignIcon, color: 'text-green-600 bg-green-50',
          sub: `${currency}${data.paidEarnings.toLocaleString()} paid · ${currency}${data.pendingEarnings.toLocaleString()} pending` },
        { title: 'Products',        value: `${data.inStockProducts} / ${data.totalProducts}`, icon: ShoppingBasketIcon,   color: 'text-purple-600 bg-purple-50',
          sub: 'in stock / total' },
        { title: 'Reviews',         value: data.totalReviews,                             icon: StarIcon,            color: 'text-amber-600 bg-amber-50',
          sub: data.avgRating ? `Avg: ${data.avgRating} ★` : 'No reviews yet' },
    ]

    const statusEntries = Object.entries(data.statusBreakdown || {})

    return (
        <div className="text-slate-500 dark:text-slate-300 mb-28">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h1 className="text-2xl">Seller <span className="text-slate-800 dark:text-slate-100 font-medium">Dashboard</span></h1>
                <div className="flex gap-2">
                    {PERIODS.map(p => (
                        <button key={p.value} onClick={() => setPeriod(p.value)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition ${period === p.value ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'}`}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {summaryCards.map((card, i) => (
                    <div key={i} className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 rounded-xl p-4 hover:shadow-sm dark:hover:shadow-slate-950/50 transition">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${card.color}`}><card.icon size={16} /></div>
                            <p className="text-xs text-slate-400 dark:text-slate-400">{card.title}</p>
                        </div>
                        <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{card.value}</p>
                        {card.sub && <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">{card.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Revenue chart */}
            {data.revenueChart?.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 rounded-xl p-5 mb-8">
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 mb-4">Revenue — last {period} days</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={data.revenueChart}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:opacity-30" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${currency}${(v/1000).toFixed(0)}k`} />
                            <Tooltip formatter={v => [`${currency}${v.toLocaleString()}`, 'Revenue']} labelFormatter={l => `Date: ${l}`} />
                            <Area type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} fill="url(#revenueGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Order status breakdown */}
                {statusEntries.length > 0 && (
                    <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 mb-4">Order Status Breakdown</h2>
                        <div className="space-y-3">
                            {statusEntries.map(([status, count]) => {
                                const total = data.totalOrders
                                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                                return (
                                    <div key={status}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-600 dark:text-slate-200">{status.replace('_', ' ')}</span>
                                            <span className="text-slate-400 dark:text-slate-400">{count} ({pct}%)</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] || '#94a3b8' }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Top products */}
                {data.topProducts?.length > 0 && (
                    <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 mb-4">Top Products by Orders</h2>
                        <div className="space-y-3">
                            {data.topProducts.map((p, i) => (
                                <div key={p.productId} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-1.5 transition"
                                    onClick={() => router.push(`/product/${p.productId}`)}>
                                    <span className="text-xs font-bold text-slate-300 dark:text-slate-500 w-4">{i + 1}</span>
                                    {p.image && (
                                        <Image src={p.image} alt="" width={36} height={36} className="w-9 h-9 rounded object-cover border border-slate-100 dark:border-slate-700" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-100 truncate">{p.name}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-400">{p.orderCount} orders · {p.totalQty} units</p>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-200 shrink-0">{currency}{p.price.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Recent reviews */}
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 mb-4">Latest Reviews</h2>
            <div className="max-w-4xl space-y-4">
                {data.ratings.slice(0, 5).map((review, i) => (
                    <div key={i} className="flex max-sm:flex-col gap-5 sm:items-start justify-between py-4 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex gap-3">
                            <Image src={review.user.image} alt="" className="w-9 h-9 aspect-square rounded-full object-cover shrink-0" width={36} height={36} />
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-100">{review.user.name}</p>
                                <p className="text-slate-400 dark:text-slate-400 text-xs">{new Date(review.createdAt).toLocaleDateString()}</p>
                                <p className="mt-2 text-slate-500 dark:text-slate-300 max-w-xs leading-6">{review.review}</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                            <div className="flex">
                                {Array(5).fill('').map((_, j) => (
                                    <span key={j} className={`text-sm ${review.rating > j ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-400">{review.product?.name}</p>
                            <button onClick={() => router.push(`/product/${review.product?.id}`)}
                                className="text-xs bg-slate-100 dark:bg-slate-800 dark:text-slate-100 px-3 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                                View Product
                            </button>
                        </div>
                    </div>
                ))}
                {data.ratings.length === 0 && <p className="text-slate-400 dark:text-slate-400 text-sm">No reviews yet.</p>}
            </div>
        </div>
    )
}
