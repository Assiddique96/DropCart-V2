'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { CheckCircleIcon, XCircleIcon, RotateCcwIcon } from "lucide-react"

const STATUS_COLORS = {
    REQUESTED: 'bg-blue-50 text-blue-700',
    APPROVED:  'bg-green-50 text-green-700',
    REJECTED:  'bg-red-50 text-red-500',
    REFUNDED:  'bg-slate-100 text-slate-500',
}

export default function AdminRefunds() {
    const { getToken } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const [loading, setLoading] = useState(true)
    const [refunds, setRefunds] = useState([])
    const [filter, setFilter] = useState('')
    const [actionModal, setActionModal] = useState(null)
    const [form, setForm] = useState({ action: '', adminNote: '', amount: '' })
    const [submitting, setSubmitting] = useState(false)

    const fetchRefunds = async () => {
        setLoading(true)
        try {
            const token = await getToken()
            const url = filter ? `/api/admin/refunds?status=${filter}` : '/api/admin/refunds'
            const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
            setRefunds(data.refunds)
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
        setLoading(false)
    }

    useEffect(() => { fetchRefunds() }, [filter])

    const handleAction = async () => {
        if (!actionModal || !form.action) return
        setSubmitting(true)
        try {
            const token = await getToken()
            await axios.patch('/api/admin/refunds', {
                refundId: actionModal.id,
                action: form.action,
                adminNote: form.adminNote,
                amount: form.amount ? parseFloat(form.amount) : undefined,
            }, { headers: { Authorization: `Bearer ${token}` } })
            toast.success("Refund updated.")
            setActionModal(null)
            setForm({ action: '', adminNote: '', amount: '' })
            fetchRefunds()
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
        setSubmitting(false)
    }

    return (
        <div className="text-slate-500 mb-28">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl">Refund <span className="text-slate-800 font-medium">Requests</span></h1>
                    <p className="text-xs text-slate-400 mt-0.5">{refunds.length} request{refunds.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-2">
                    {['', 'REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED'].map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition ${filter === s ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                            {s || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? <Loading /> : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Store</th>
                                <th className="px-4 py-3">Order Total</th>
                                <th className="px-4 py-3">Reason</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {refunds.map(refund => (
                                <tr key={refund.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{refund.order?.user?.name}</p>
                                        <p className="text-xs text-slate-400">{refund.order?.user?.email}</p>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{refund.order?.store?.name}</td>
                                    <td className="px-4 py-3 font-semibold">{currency}{refund.order?.total?.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate" title={refund.reason}>{refund.reason}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[refund.status]}`}>
                                            {refund.status}
                                        </span>
                                        {refund.amount && <p className="text-xs text-green-600 mt-0.5">{currency}{refund.amount}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(refund.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        {refund.status === 'REQUESTED' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => { setActionModal(refund); setForm({ action: 'approve', adminNote: '', amount: refund.order?.total || '' }) }}
                                                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 transition">
                                                    <CheckCircleIcon size={13} /> Approve
                                                </button>
                                                <button onClick={() => { setActionModal(refund); setForm({ action: 'reject', adminNote: '', amount: '' }) }}
                                                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition">
                                                    <XCircleIcon size={13} /> Reject
                                                </button>
                                            </div>
                                        )}
                                        {refund.status === 'APPROVED' && (
                                            <button onClick={() => { setActionModal(refund); setForm({ action: 'mark_refunded', adminNote: '', amount: refund.amount || '' }) }}
                                                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 transition">
                                                <RotateCcwIcon size={13} /> Mark Refunded
                                            </button>
                                        )}
                                        {['REJECTED', 'REFUNDED'].includes(refund.status) && (
                                            <span className="text-xs text-slate-300">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {refunds.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No refund requests found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Action modal */}
            {actionModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-1 capitalize">
                            {form.action === 'mark_refunded' ? 'Mark as Refunded' : form.action} Refund
                        </h3>
                        <p className="text-sm text-slate-500 mb-1">Customer: {actionModal.order?.user?.name}</p>
                        <p className="text-sm text-slate-500 mb-4">Reason: <span className="italic">{actionModal.reason}</span></p>

                        {['approve', 'mark_refunded'].includes(form.action) && (
                            <div className="mb-3">
                                <label className="text-xs text-slate-500 mb-1 block">Refund Amount ({currency})</label>
                                <input type="number" min="0" value={form.amount}
                                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="text-xs text-slate-500 mb-1 block">Admin Note (optional)</label>
                            <textarea value={form.adminNote} onChange={e => setForm(f => ({ ...f, adminNote: e.target.value }))}
                                rows={3} placeholder="Internal note visible to admin only"
                                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none resize-none" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleAction} disabled={submitting}
                                className={`flex-1 py-2 rounded-lg text-white text-sm transition disabled:opacity-50 ${
                                    form.action === 'reject' ? 'bg-red-500 hover:bg-red-600' :
                                    form.action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                                    'bg-slate-700 hover:bg-slate-800'
                                }`}>
                                {submitting ? "Processing..." : "Confirm"}
                            </button>
                            <button onClick={() => setActionModal(null)}
                                className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 transition">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
