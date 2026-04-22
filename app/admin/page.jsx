'use client'
import Loading from "@/components/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import MadeInPieChart from "@/components/MadeInPieChart"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { CircleDollarSignIcon, ShoppingBasketIcon, StoreIcon, TagsIcon, UsersIcon, XCircleIcon, CheckCircleIcon, BanknoteIcon, ShieldCheckIcon, ChevronRightIcon, ArrowUpRightIcon, CheckIcon, XIcon, ClockIcon, SlidersHorizontalIcon } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import Link from "next/link"

export default function AdminDashboard() {
    const { getToken } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({ days: 7, paid: 'all' }) // days: 7|30|0(all) ; paid: all|paid|unpaid
    const [data, setData] = useState({
        products: 0, revenue: 0, paidRevenue: 0, unpaidRevenue: 0,
        orders: 0, stores: 0, users: 0, cancelledOrders: 0, allOrders: [],
        recentOrders: [],
        recentStores: [],
        madeInBreakdown: [],
    })

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const { data: res } = await axios.get("/api/admin/dashboard", { headers: { Authorization: `Bearer ${token}` } })
                setData(res)
            } catch (e) { toast.error(e?.response?.data?.message || e.message) }
            setLoading(false)
        })()
    }, [])

    if (loading) return <Loading />

    const now = Date.now()
    const withinDays = (dateValue, days) => {
        if (!days) return true
        const t = new Date(dateValue).getTime()
        if (!Number.isFinite(t)) return false
        return t >= now - days * 24 * 60 * 60 * 1000
    }

    const filteredRecentOrders = (data.recentOrders || []).filter((o) => {
        if (!withinDays(o.createdAt, filters.days)) return false
        if (filters.paid === 'paid' && !o.isPaid) return false
        if (filters.paid === 'unpaid' && o.isPaid) return false
        return true
    })

    const filteredAllOrdersForChart = (data.allOrders || []).filter((o) => {
        if (!withinDays(o.createdAt, filters.days)) return false
        if (filters.paid === 'paid' && !(o.isPaid ?? false)) return false
        if (filters.paid === 'unpaid' && (o.isPaid ?? false)) return false
        return true
    })

    const formatDateTime = (value) => {
        try {
            return new Date(value).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch {
            return "-"
        }
    }

    const StatusPill = ({ value }) => {
        const v = String(value || "").toUpperCase()
        const palette = {
            ORDER_PLACED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
            PACKED: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200",
            SHIPPED: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200",
            DELIVERED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
            CANCELLED: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
            PENDING: "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200",
            REJECTED: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
            APPROVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
            PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
            UNPAID: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
        }
        const cls = palette[v] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>
                {v.replaceAll("_", " ") || "—"}
            </span>
        )
    }

    const groupedCards = [
        {
            group: "Financials",
            description: "Revenue and outstanding balances",
            cards: [
                { title: 'Total Revenue', value: `${currency}${Number(data.revenue).toLocaleString()}`, icon: CircleDollarSignIcon, sub: `${currency}${Number(data.paidRevenue).toLocaleString()} paid`, color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30', accent: 'border-l-emerald-500', href: '/admin/payouts' },
                { title: 'Unpaid Revenue', value: `${currency}${Number(data.unpaidRevenue).toLocaleString()}`, icon: BanknoteIcon, color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30', accent: 'border-l-amber-500', href: '/admin/payouts' },
            ],
        },
        {
            group: "User/Store Growth",
            description: "Marketplace demand and supply",
            cards: [
                { title: 'Total Users', value: data.users, icon: UsersIcon, color: 'text-slate-700 bg-slate-100 dark:bg-slate-800', accent: 'border-l-slate-400', href: '/admin/users' },
                { title: 'Total Stores', value: data.totalStores ?? 0, icon: StoreIcon, sub: `${data.approvedStores ?? 0} approved · ${data.pendingStores ?? 0} pending · ${data.rejectedStores ?? 0} rejected`, color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30', accent: 'border-l-indigo-500', href: '/admin/stores' },
                { title: 'New Store Applications', value: data.pendingStores ?? 0, icon: ShieldCheckIcon, sub: 'Review & approve', color: 'text-yellow-800 bg-yellow-50 dark:bg-yellow-950/30', accent: 'border-l-yellow-500', href: '/admin/approve' },
            ],
        },
        {
            group: "Inventory & Sales",
            description: "Supply health and purchase volume",
            cards: [
                { title: 'Total Products', value: data.products, icon: ShoppingBasketIcon, color: 'text-purple-700 bg-purple-50 dark:bg-purple-950/30', accent: 'border-l-purple-500', href: '/admin/products' },
                { title: 'Total Orders', value: data.orders, icon: TagsIcon, sub: `${data.cancelledOrders} cancelled`, color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/30', accent: 'border-l-blue-500' },
            ],
        },
        {
            group: "Store Health",
            description: "Approval funnel outcomes",
            cards: [
                { title: 'Approved Stores', value: data.approvedStores ?? 0, icon: CheckCircleIcon, color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30', accent: 'border-l-emerald-500', href: '/admin/stores' },
                { title: 'Rejected Stores', value: data.rejectedStores ?? 0, icon: XCircleIcon, color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/30', accent: 'border-l-rose-500', href: '/admin/stores' },
            ],
        },
    ]

    const Card = ({ card }) => {
        const Inner = (
            <div className={[
                "group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800",
                "border-l-4",
                card.accent || "border-l-slate-200 dark:border-l-slate-800",
                "bg-white dark:bg-slate-900/60",
                "p-4 sm:p-5",
                "transition",
                card.href ? "hover:-translate-y-0.5 hover:shadow-sm dark:hover:shadow-slate-950/40 cursor-pointer" : "opacity-95",
            ].join(" ")}>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-slate-50/60 to-transparent dark:from-white/5" />

                <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl ${card.color} ring-1 ring-black/5`}>
                            <card.icon size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 dark:text-slate-400">{card.title}</p>
                            <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1 leading-none">
                                {card.value}
                            </p>
                        </div>
                    </div>

                    {card.href && (
                        <span className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 transition">
                            <ChevronRightIcon size={18} />
                        </span>
                    )}
                </div>

                {card.sub && (
                    <p className="relative mt-3 text-xs text-slate-400 dark:text-slate-400 leading-relaxed">
                        {card.sub}
                    </p>
                )}
            </div>
        )

        if (!card.href) return <div>{Inner}</div>
        return (
            <Link href={card.href} className="block">
                {Inner}
            </Link>
        )
    }

    const updateStoreStatus = async ({ storeId, status }) => {
        const token = await getToken()
        await axios.post("/api/admin/approve-store", { storeId, status }, {
            headers: { Authorization: `Bearer ${token}` }
        })
        const { data: res } = await axios.get("/api/admin/dashboard", { headers: { Authorization: `Bearer ${token}` } })
        setData(res)
    }

    return (
        <div className="text-slate-500 dark:text-slate-300 mb-28">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <h1 className="text-2xl">Admin <span className="text-slate-800 dark:text-slate-100 font-medium">Dashboard</span></h1>

                <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                        <SlidersHorizontalIcon size={14} /> Filters
                    </span>
                    <div className="flex items-center gap-2">
                        {[
                            { label: '7d', value: 7 },
                            { label: '30d', value: 30 },
                            { label: 'All', value: 0 },
                        ].map((opt) => (
                            <button
                                key={opt.label}
                                onClick={() => setFilters((f) => ({ ...f, days: opt.value }))}
                                className={[
                                    "text-xs px-3 py-1.5 rounded-lg border transition",
                                    filters.days === opt.value
                                        ? "bg-slate-800 text-white border-slate-800"
                                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-slate-400",
                                ].join(" ")}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        {[
                            { label: 'All', value: 'all' },
                            { label: 'Paid', value: 'paid' },
                            { label: 'Unpaid', value: 'unpaid' },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setFilters((f) => ({ ...f, paid: opt.value }))}
                                className={[
                                    "text-xs px-3 py-1.5 rounded-lg border transition",
                                    filters.paid === opt.value
                                        ? "bg-slate-800 text-white border-slate-800"
                                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-slate-400",
                                ].join(" ")}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-8 mb-10">
                {groupedCards.map((g) => (
                    <section key={g.group}>
                        <div className="flex items-end justify-between gap-4 flex-wrap mb-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{g.group}</p>
                                {g.description && (
                                    <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">{g.description}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {g.cards.map((card, i) => <Card key={`${g.group}-${i}`} card={card} />)}
                        </div>
                    </section>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-10">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200/70 dark:border-slate-800/80">
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent orders</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-400">Latest activity across all vendors</p>
                        </div>
                        <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:underline">
                            View all <ArrowUpRightIcon size={14} />
                        </Link>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredRecentOrders.slice(0, 8).map((o) => (
                            <Link key={o.id} href={`/admin/orders/${o.id}`} className="block">
                                <div className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-950/20 transition-colors">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                            {o.store?.name || "Store"}
                                        </p>
                                        <StatusPill value={o.status} />
                                        <StatusPill value={o.isPaid ? "PAID" : "UNPAID"} />
                                    </div>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate mt-1">
                                        {o.user?.name || o.user?.email || "Customer"} · {formatDateTime(o.createdAt)} · {String(o.paymentMethod || "").toUpperCase()}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        {currency}{Number(o.total || 0).toLocaleString()}
                                    </p>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-400">
                                        {String(o.id).slice(0, 8)}…
                                    </p>
                                </div>
                                </div>
                            </Link>
                        ))}

                        {filteredRecentOrders.length === 0 && (
                            <div className="px-5 py-6 text-sm text-slate-400 dark:text-slate-400">
                                No orders match the current filters.
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200/70 dark:border-slate-800/80">
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Store applications</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-400">Newest pending/rejected stores needing review</p>
                        </div>
                        <Link href="/admin/approve" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:underline">
                            Review <ArrowUpRightIcon size={14} />
                        </Link>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(data.recentStores || []).slice(0, 6).map((s) => (
                            <div key={s.id} className="px-5 py-3 flex items-center gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                            {s.name || "Store"}
                                        </p>
                                        <StatusPill value={s.status} />
                                    </div>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate mt-1">
                                        {s.user?.name || s.user?.email || "Owner"} · {formatDateTime(s.createdAt)}
                                    </p>
                                </div>
                                <div className="shrink-0 flex items-center gap-2 flex-wrap justify-end">
                                    <button
                                        onClick={() => toast.promise(updateStoreStatus({ storeId: s.id, status: "approved" }), { loading: "Approving…" })}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                                    >
                                        <CheckIcon size={14} /> Approve
                                    </button>
                                    <button
                                        onClick={() => toast.promise(updateStoreStatus({ storeId: s.id, status: "pending" }), { loading: "Marking pending…" })}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition"
                                    >
                                        <ClockIcon size={14} /> Pending
                                    </button>
                                    <button
                                        onClick={() => toast.promise(updateStoreStatus({ storeId: s.id, status: "rejected" }), { loading: "Rejecting…" })}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
                                    >
                                        <XIcon size={14} /> Reject
                                    </button>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-400">
                                        {String(s.id).slice(0, 8)}…
                                    </p>
                                </div>
                            </div>
                        ))}

                        {(data.recentStores || []).length === 0 && (
                            <div className="px-5 py-6 text-sm text-slate-400 dark:text-slate-400">
                                No store applications found.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 overflow-hidden">
                    <OrdersAreaChart allOrders={filteredAllOrdersForChart} />
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 overflow-hidden">
                    <MadeInPieChart data={data.madeInBreakdown} />
                </div>
            </div>
        </div>
    )
}
