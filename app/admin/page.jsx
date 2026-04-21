'use client'
import Loading from "@/components/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { CircleDollarSignIcon, ShoppingBasketIcon, StoreIcon, TagsIcon, UsersIcon, XCircleIcon, CheckCircleIcon, BanknoteIcon } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function AdminDashboard() {
    const { getToken } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        products: 0, revenue: 0, paidRevenue: 0, unpaidRevenue: 0,
        orders: 0, stores: 0, users: 0, cancelledOrders: 0, allOrders: [],
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

    const cards = [
        { title: 'Total Revenue', value: `${currency}${Number(data.revenue).toLocaleString()}`, icon: CircleDollarSignIcon, sub: `${currency}${Number(data.paidRevenue).toLocaleString()} paid`, color: 'text-green-600 bg-green-50' },
        { title: 'Unpaid Revenue', value: `${currency}${Number(data.unpaidRevenue).toLocaleString()}`, icon: BanknoteIcon, color: 'text-amber-600 bg-amber-50' },
        { title: 'Total Orders', value: data.orders, icon: TagsIcon, sub: `${data.cancelledOrders} cancelled`, color: 'text-blue-600 bg-blue-50' },
        { title: 'Total Products', value: data.products, icon: ShoppingBasketIcon, color: 'text-purple-600 bg-purple-50' },
        { title: 'Active Stores', value: data.stores, icon: StoreIcon, color: 'text-indigo-600 bg-indigo-50' },
        { title: 'Total Users', value: data.users, icon: UsersIcon, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' },
    ]

    return (
        <div className="text-slate-500 dark:text-slate-300 mb-28">
            <h1 className="text-2xl mb-4">Admin <span className="text-slate-800 dark:text-slate-100 font-medium">Dashboard</span></h1>

            <div className="flex flex-wrap gap-4 mb-10">
                {cards.map((card, i) => (
                    <div key={i} className="flex items-center gap-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 hover:shadow-sm dark:hover:shadow-slate-950/50 transition p-4 px-5 rounded-xl min-w-[180px]">
                        <div className={`p-2.5 rounded-full ${card.color}`}>
                            <card.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 dark:text-slate-400">{card.title}</p>
                            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-0.5">{card.value}</p>
                            {card.sub && <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">{card.sub}</p>}
                        </div>
                    </div>
                ))}
            </div>

            <OrdersAreaChart allOrders={data.allOrders} />
        </div>
    )
}
