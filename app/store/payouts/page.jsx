'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import { getStoreAuthHeaders } from "@/lib/storeAuthHeaders"
import Loading from "@/components/Loading"
import { CircleDollarSignIcon, ClockIcon, CheckCircleIcon } from "lucide-react"

export default function SellerPayouts() {
    const { getToken } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        payouts: [],
        totalDeliveredRevenue: 0,
        totalPaidOut: 0,
        pendingBalance: 0,
    })

    const fetchPayouts = async () => {
        try {
            const { data: res } = await axios.get("/api/store/payouts", {
                headers: await getStoreAuthHeaders(getToken)
            })
            setData(res)
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    useEffect(() => { fetchPayouts() }, [])

    if (loading) return <Loading />

    const cards = [
        { label: "Total Revenue (Delivered)", value: `${currency}${data.totalDeliveredRevenue.toLocaleString()}`, icon: CircleDollarSignIcon, color: "text-green-600 bg-green-50" },
        { label: "Total Paid Out", value: `${currency}${data.totalPaidOut.toLocaleString()}`, icon: CheckCircleIcon, color: "text-blue-600 bg-blue-50" },
        { label: "Pending Balance", value: `${currency}${data.pendingBalance.toLocaleString()}`, icon: ClockIcon, color: data.pendingBalance > 0 ? "text-amber-600 bg-amber-50" : "text-slate-400 bg-slate-50 dark:bg-slate-900" },
    ]

    return (
        <div className="text-slate-500 dark:text-slate-300 mb-28">
            <h1 className="text-2xl mb-1">Payout <span className="text-slate-800 dark:text-slate-100 font-medium">History</span></h1>
            <p className="text-xs text-slate-400 mb-6">Revenue is counted from delivered, paid orders only.</p>

            <div className="flex flex-wrap gap-4 mb-8">
                {cards.map((card, i) => (
                    <div key={i} className="flex items-center gap-4 border border-slate-200 dark:border-slate-700 rounded-lg p-4 px-6">
                        <div className={`p-2.5 rounded-full ${card.color}`}>
                            <card.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">{card.label}</p>
                            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-0.5">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {data.payouts.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <CircleDollarSignIcon size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No payouts recorded yet.</p>
                    <p className="text-xs mt-1">Payouts are issued by the platform admin.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-gray-700 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                            {data.payouts.map((payout) => (
                                <tr key={payout.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(payout.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{currency}{payout.amount.toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${payout.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {payout.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 text-xs">{payout.note || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
