'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import {
  PlusIcon, CheckCircleIcon, SearchIcon, XIcon,
  ClockIcon, BanknoteIcon, RefreshCwIcon, CheckIcon
} from "lucide-react"

export default function AdminPayouts() {
  const { getToken } = useAuth()
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'
  const [loading, setLoading] = useState(true)
  const [payouts, setPayouts] = useState([])
  const [stores, setStores] = useState([])   // ← FIX: was reading wrong shape
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ storeId: '', amount: '', note: '' })
  const [submitting, setSubmitting] = useState(false)
  const [approving, setApproving] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tab, setTab] = useState('all') // 'all' | 'pending'

  const selectedStore = stores.find((s) => s.id === form.storeId)

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [payoutsRes, storesRes] = await Promise.all([
        axios.get("/api/admin/payouts", { headers }),
        axios.get("/api/admin/stores", { headers }),
      ])
      setPayouts(payoutsRes.data.payouts || [])
      // FIX: admin/stores returns { stores, counts } — not a raw array
      setStores(storesRes.data.stores || storesRes.data || [])
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const submitPayout = async () => {
    if (!form.storeId || !form.amount) return toast.error("Store and amount are required.")
    setSubmitting(true)
    try {
      const token = await getToken()
      await axios.post("/api/admin/payouts", {
        storeId: form.storeId,
        amount: Number(form.amount),
        note: form.note
      }, { headers: { Authorization: `Bearer ${token}` } })
      toast.success("Payout recorded.")
      setForm({ storeId: '', amount: '', note: '' })
      setShowForm(false)
      fetchData()
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message)
    }
    setSubmitting(false)
  }

  // Approve a PENDING payout request from a seller
  const approvePayout = async (payoutId) => {
    setApproving(payoutId)
    try {
      const token = await getToken()
      await axios.patch("/api/admin/payouts", { payoutId, status: "PAID" }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Payout marked as paid.")
      setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: "PAID" } : p))
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message)
    }
    setApproving(null)
  }

  const pendingPayouts = payouts.filter(p => p.status === 'PENDING')
  const filteredPayouts = payouts.filter(p => {
    if (tab === 'pending' && p.status !== 'PENDING') return false
    if (statusFilter && p.status !== statusFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (
        !p.store?.name?.toLowerCase().includes(q) &&
        !p.store?.username?.toLowerCase().includes(q) &&
        !p.note?.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const totalPaid = payouts.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  const totalPending = payouts.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0)

  if (loading) return <Loading />

  return (
    <div className="text-slate-500 dark:text-slate-300 mb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl">Seller <span className="text-slate-800 dark:text-slate-100 font-medium">Payouts</span></h1>
          <p className="text-xs text-slate-400 mt-0.5">{payouts.length} total payout records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 text-sm rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
            <RefreshCwIcon size={14} />
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-sm rounded-lg hover:bg-slate-900 dark:hover:bg-slate-200 transition font-semibold">
            <PlusIcon size={15} /> Record Payout
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
            <CheckCircleIcon size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Paid Out</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{currency}{totalPaid.toLocaleString()}</p>
          </div>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3">
          <div className={`p-2.5 rounded-full ${pendingPayouts.length > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
            <ClockIcon size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Pending Requests</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{currency}{totalPending.toLocaleString()}</p>
            {pendingPayouts.length > 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">{pendingPayouts.length} awaiting approval</p>
            )}
          </div>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <BanknoteIcon size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Records</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{payouts.length}</p>
          </div>
        </div>
      </div>

      {/* Record payout form */}
      {showForm && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-6 max-w-lg bg-slate-50 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Record Manual Payout</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Store *</label>
              <select
                value={form.storeId} onChange={e => setForm({ ...form, storeId: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
              >
                <option value="">Select a store...</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (@{s.username})</option>
                ))}
              </select>
              {selectedStore && (
                <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{selectedStore.name} — payout account</p>
                  <p>Bank: <span className="font-medium text-slate-800 dark:text-slate-100">{selectedStore.payoutBankName || '—'}</span></p>
                  <p>Name: <span className="font-medium text-slate-800 dark:text-slate-100">{selectedStore.payoutAccountName || '—'}</span></p>
                  <p>Number: <span className="font-medium text-slate-800 dark:text-slate-100">{selectedStore.payoutAccountNumber || '—'}</span></p>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Amount ({currency}) *</label>
              <input
                type="number" min="0" step="0.01" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Note (optional)</label>
              <input
                type="text" value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                placeholder="e.g. Bank transfer — March 2025"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={submitPayout} disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-900 transition disabled:opacity-50 font-medium">
                <CheckCircleIcon size={14} /> {submitting ? "Saving..." : "Record Payout"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { key: 'all', label: `All (${payouts.length})` },
            { key: 'pending', label: `Pending (${pendingPayouts.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setStatusFilter('') }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === t.key
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <SearchIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search store, note..."
              className="border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs outline-none w-48 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><XIcon size={12} /></button>}
          </div>
          {tab === 'all' && (
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </select>
          )}
        </div>
      </div>

      {/* Payouts table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 hidden md:table-cell">Note</th>
              <th className="px-4 py-3 hidden md:table-cell">Date</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
            {filteredPayouts.map(p => (
              <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${p.status === 'PENDING' ? 'bg-amber-50/40 dark:bg-amber-900/5' : ''}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {p.store?.name}
                    <span className="text-xs text-slate-400 ml-1 font-normal">@{p.store?.username}</span>
                  </p>
                  {p.store?.payoutBankName && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {p.store.payoutBankName} · {p.store.payoutAccountName}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                  {currency}{(p.amount || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    p.status === 'PAID'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {p.status === 'PAID' ? '✓ Paid' : '⏳ Pending'}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-400 text-xs">{p.note || "—"}</td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-400 text-xs whitespace-nowrap">
                  {new Date(p.createdAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  {p.status === 'PENDING' ? (
                    <button
                      onClick={() => approvePayout(p.id)}
                      disabled={approving === p.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition disabled:opacity-50 font-medium"
                    >
                      <CheckIcon size={12} />
                      {approving === p.id ? "Approving..." : "Approve"}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredPayouts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  {payouts.length === 0 ? "No payouts recorded yet." : "No payouts match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
