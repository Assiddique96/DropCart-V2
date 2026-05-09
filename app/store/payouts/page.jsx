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
        totalRequested: 0,
        availableBalance: 0,
        pendingBalance: 0,
    })
    const [amount, setAmount] = useState('')
    const [note, setNote] = useState('')
    const [submitting, setSubmitting] = useState(false)

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

    const submitPayout = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Enter a valid payout amount.")
            return
        }

        const requestedAmount = Number(amount)
        if (requestedAmount > (data.availableBalance || 0)) {
            toast.error("Requested amount exceeds available balance.")
            return
        }

        setSubmitting(true)
        try {
            await axios.post(
                "/api/store/payouts",
                { amount: requestedAmount, note },
                { headers: await getStoreAuthHeaders(getToken) }
            )
            toast.success("Payout request submitted.")
            setAmount('')
            setNote('')
            await fetchPayouts()
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        }
        setSubmitting(false)
    }

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

            <div className="border border-slate-200 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900/70 p-5 mb-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Request a payout</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Request payment from the platform admin for your available balance.
                        </p>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                        Available to request: {currency}{data.availableBalance.toLocaleString()}
                    </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_240px]">
                    <div className="grid gap-3">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Amount</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            placeholder="Enter payout amount"
                        />
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Note (optional)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            placeholder="Add a note for admin"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={submitPayout}
                            disabled={submitting || data.availableBalance <= 0}
                            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? "Requesting..." : "Request payout"}
                        </button>
                    </div>
                </div>
                {data.availableBalance <= 0 && (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">No available balance to request at this time.</p>
                )}
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
