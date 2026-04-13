'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { PlusIcon, CheckCircleIcon } from "lucide-react"

export default function AdminPayouts() {
    const { getToken } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const [loading, setLoading] = useState(true)
    const [payouts, setPayouts] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ storeId: '', amount: '', note: '' })
    const [submitting, setSubmitting] = useState(false)
    const [stores, setStores] = useState([])

    const fetchData = async () => {
        try {
            const token = await getToken()
            const [payoutsRes, storesRes] = await Promise.all([
                axios.get("/api/admin/payouts", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("/api/admin/stores", { headers: { Authorization: `Bearer ${token}` } }),
            ])
            setPayouts(payoutsRes.data.payouts)
            setStores(storesRes.data)
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    const submitPayout = async () => {
        if (!form.storeId || !form.amount) return toast.error("Store and amount are required.")
        setSubmitting(true)
        try {
            const token = await getToken()
            await axios.post("/api/admin/payouts", form, { headers: { Authorization: `Bearer ${token}` } })
            toast.success("Payout recorded.")
            setForm({ storeId: '', amount: '', note: '' })
            setShowForm(false)
            fetchData()
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
        setSubmitting(false)
    }

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl">Seller <span className="text-slate-800 font-medium">Payouts</span></h1>
                    <p className="text-xs text-slate-400 mt-0.5">{payouts.length} payout records</p>
                </div>
                <button onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-900 transition">
                    <PlusIcon size={15} /> Record Payout
                </button>
            </div>

            {showForm && (
                <div className="border border-slate-200 rounded-xl p-5 mb-6 max-w-lg bg-slate-50">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">New Payout</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Store</label>
                            <select value={form.storeId} onChange={e => setForm({ ...form, storeId: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none">
                                <option value="">Select store...</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.username})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Amount ({currency})</label>
                            <input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                                placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Note (optional)</label>
                            <input type="text" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                                placeholder="e.g. Bank transfer - March 2025"
                                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
                        </div>
                        <div className="flex gap-3 pt-1">
                            <button onClick={submitPayout} disabled={submitting}
                                className="flex items-center gap-1.5 px-5 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-900 transition disabled:opacity-50">
                                <CheckCircleIcon size={14} /> {submitting ? "Saving..." : "Record Payout"}
                            </button>
                            <button onClick={() => setShowForm(false)}
                                className="px-5 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Store</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Note</th>
                            <th className="px-4 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {payouts.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-800">{p.store?.name}<span className="text-xs text-slate-400 ml-1">@{p.store?.username}</span></td>
                                <td className="px-4 py-3 font-semibold">{currency}{p.amount.toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-xs">{p.note || "—"}</td>
                                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {payouts.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-12 text-slate-400">No payouts recorded yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
