'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import { getStoreAuthHeaders } from "@/lib/storeAuthHeaders"
import Loading from "@/components/Loading"
import {
  CircleDollarSignIcon, ClockIcon, CheckCircleIcon,
  AlertCircleIcon, RefreshCwIcon, BanknoteIcon,
  TrendingUpIcon, SearchIcon, XIcon
} from "lucide-react"

const EMPTY_DATA = {
  payouts: [],
  store: null,
  totalDeliveredRevenue: 0,
  totalGrossRevenue: 0,
  totalCommission: 0,
  totalPaidOut: 0,
  totalRequested: 0,
  availableBalance: 0,
  pendingBalance: 0,
}

function safeNum(val) {
  const n = Number(val)
  return Number.isFinite(n) ? n : 0
}

function fmt(currency, val) {
  return `${currency}${safeNum(val).toLocaleString()}`
}

export default function SellerPayouts() {
  const { getToken } = useAuth()
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(EMPTY_DATA)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchPayouts = async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = await getStoreAuthHeaders(getToken)
      const { data: res } = await axios.get("/api/store/payouts", { headers })
      // Ensure all numeric fields are safe
      setData({
        payouts: Array.isArray(res.payouts) ? res.payouts : [],
        store: res.store ?? null,
        totalDeliveredRevenue: safeNum(res.totalDeliveredRevenue),
        totalGrossRevenue: safeNum(res.totalGrossRevenue),
        totalCommission: safeNum(res.totalCommission),
        totalPaidOut: safeNum(res.totalPaidOut),
        totalRequested: safeNum(res.totalRequested),
        availableBalance: safeNum(res.availableBalance),
        pendingBalance: safeNum(res.pendingBalance),
      })
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to load payout data"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayouts() }, [])

  const submitPayout = async () => {
    const requestedAmount = Number(amount)
    if (!requestedAmount || requestedAmount <= 0) {
      toast.error("Enter a valid payout amount.")
      return
    }
    if (requestedAmount > data.availableBalance) {
      toast.error(`Requested amount exceeds available balance of ${fmt(currency, data.availableBalance)}.`)
      return
    }
    setSubmitting(true)
    try {
      const headers = await getStoreAuthHeaders(getToken)
      await axios.post("/api/store/payouts", { amount: requestedAmount, note }, { headers })
      toast.success("Payout request submitted.")
      setAmount('')
      setNote('')
      await fetchPayouts()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    }
    setSubmitting(false)
  }

  // Filtered payout history
  const filteredPayouts = (data.payouts || []).filter(p => {
    if (statusFilter && p.status !== statusFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!p.id?.toLowerCase().includes(q) && !p.note?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const cards = [
    {
      label: "Net Revenue (after commission)",
      value: fmt(currency, data.totalDeliveredRevenue),
      icon: TrendingUpIcon,
      color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
      sub: data.totalCommission > 0
        ? `${fmt(currency, data.totalGrossRevenue)} gross − ${fmt(currency, data.totalCommission)} platform fee`
        : null,
    },
    {
      label: "Total Paid Out",
      value: fmt(currency, data.totalPaidOut),
      icon: CheckCircleIcon,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    },
    {
      label: "Pending (In Request)",
      value: fmt(currency, data.totalRequested),
      icon: ClockIcon,
      color: data.totalRequested > 0
        ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
        : "text-slate-400 bg-slate-50 dark:bg-slate-800",
    },
    {
      label: "Available Balance",
      value: fmt(currency, data.availableBalance),
      icon: BanknoteIcon,
      color: data.availableBalance > 0
        ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
        : "text-slate-400 bg-slate-50 dark:bg-slate-800",
    },
  ]

  if (loading) return <Loading />

  if (error) {
    return (
      <div className="text-slate-500 dark:text-slate-300 mb-28">
        <h1 className="text-2xl mb-6">
          Payout <span className="text-slate-800 dark:text-slate-100 font-medium">History</span>
        </h1>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-12 text-center gap-4">
          <AlertCircleIcon size={36} className="text-red-400" />
          <div>
            <p className="font-semibold text-red-600 dark:text-red-400">Failed to load payout data</p>
            <p className="text-xs text-red-400 dark:text-red-500 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchPayouts}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
          >
            <RefreshCwIcon size={14} /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-slate-500 dark:text-slate-300 mb-28">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="text-2xl">
          Payout <span className="text-slate-800 dark:text-slate-100 font-medium">History</span>
        </h1>
        <button onClick={fetchPayouts}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
          <RefreshCwIcon size={13} /> Refresh
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        Revenue is counted from delivered, paid orders only. Commission may be deducted by admin before payout.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="flex items-center gap-4 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <div className={`p-2.5 rounded-full shrink-0 ${card.color}`}>
              <card.icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 truncate">{card.label}</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-0.5 truncate">{card.value}</p>
              {card.sub && <p className="text-[11px] text-slate-400 truncate mt-0.5">{card.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Request payout card */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900/70 p-5 mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Request a payout</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Request payment from the platform admin for your available balance.
            </p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
            data.availableBalance > 0
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
          }`}>
            Available: {fmt(currency, data.availableBalance)}
          </div>
        </div>

        {/* Payout account details */}
        {data.store ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/70 p-4 mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-3">Payout account details</p>
            <div className="grid sm:grid-cols-3 gap-3 text-sm text-slate-700 dark:text-slate-200">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Bank</p>
                <p className="font-medium">{data.store.payoutBankName || <span className="text-slate-400 font-normal italic">Not configured</span>}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Account name</p>
                <p className="font-medium">{data.store.payoutAccountName || <span className="text-slate-400 font-normal italic">Not configured</span>}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Account number</p>
                <p className="font-medium">{data.store.payoutAccountNumber || <span className="text-slate-400 font-normal italic">Not configured</span>}</p>
              </div>
            </div>
            {(!data.store.payoutBankName || !data.store.payoutAccountNumber) && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircleIcon size={13} />
                Please update your payout bank details in <a href="/store/profile" className="underline">Store Profile</a> before requesting a payout.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-4 mb-5 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <AlertCircleIcon size={14} /> Could not load store details. Please refresh.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
          <div className="grid gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200 block mb-1">
                Amount ({currency})
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={data.availableBalance > 0 ? data.availableBalance : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={data.availableBalance <= 0}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={data.availableBalance > 0 ? `Max: ${fmt(currency, data.availableBalance)}` : "No balance available"}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200 block mb-1">
                Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                disabled={data.availableBalance <= 0}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Add a note for admin (optional)"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={submitPayout}
              disabled={submitting || data.availableBalance <= 0 || !amount}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CircleDollarSignIcon size={15} />
              {submitting ? "Requesting..." : "Request payout"}
            </button>
          </div>
        </div>

        {data.availableBalance <= 0 && (
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <AlertCircleIcon size={12} />
            {data.totalRequested > 0
              ? `You have a pending request for ${fmt(currency, data.totalRequested)}. Wait for admin approval before requesting again.`
              : "No available balance to request at this time."
            }
          </p>
        )}
      </div>

      {/* Payout history */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
          Payout history
          {data.payouts.length > 0 && (
            <span className="ml-2 text-xs text-slate-400 font-normal">({data.payouts.length} records)</span>
          )}
        </h2>
        {data.payouts.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <SearchIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search payouts..."
                className="border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs outline-none w-44 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><XIcon size={12} /></button>}
            </div>
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        )}
      </div>

      {data.payouts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CircleDollarSignIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No payouts recorded yet.</p>
          <p className="text-xs mt-1">Payouts are issued by the platform admin after reviewing your request.</p>
        </div>
      ) : filteredPayouts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>No payouts match your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredPayouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(payout.createdAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {fmt(currency, payout.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      payout.status === 'PAID'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {payout.status === 'PAID' ? '✓ Paid' : '⏳ Pending'}
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
