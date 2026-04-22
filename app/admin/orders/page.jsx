'use client'
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react"

const STATUS_OPTIONS = ["", "ORDER_PLACED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]

export default function AdminOrdersPage() {
  const { getToken } = useAuth()
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$"

  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [paid, setPaid] = useState("") // "" | "true" | "false"
  const [page, setPage] = useState(1)
  const [take] = useState(25)
  const [data, setData] = useState({ total: 0, orders: [] })

  const totalPages = useMemo(() => {
    const t = data.total || 0
    return Math.max(1, Math.ceil(t / take))
  }, [data.total, take])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const skip = (page - 1) * take
      const params = new URLSearchParams()
      params.set("take", String(take))
      params.set("skip", String(skip))
      if (status) params.set("status", status)
      if (paid) params.set("paid", paid)
      if (query.trim()) params.set("q", query.trim())

      const { data: res } = await axios.get(`/api/admin/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(res)
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, paid])

  const submitSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  return (
    <div className="text-slate-500 dark:text-slate-300 mb-28">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="text-2xl">Orders</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {data.total || 0} total
          </p>
        </div>

        <form onSubmit={submitSearch} className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order id, store, customer…"
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm outline-none w-[280px] max-w-full"
            />
          </div>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "all"} value={s}>
                {s ? s.replaceAll("_", " ") : "All statuses"}
              </option>
            ))}
          </select>

          <select
            value={paid}
            onChange={(e) => { setPaid(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm outline-none"
          >
            <option value="">All payments</option>
            <option value="true">Paid</option>
            <option value="false">Unpaid</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 transition"
          >
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/40 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {(data.orders || []).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-950/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                    <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                      {String(o.id).slice(0, 10)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.store?.name || "—"}</p>
                    <p className="text-xs text-slate-400">@{o.store?.username || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.user?.name || "—"}</p>
                    <p className="text-xs text-slate-400">{o.user?.email || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{String(o.status || "—").replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 text-xs">{o.isPaid ? "Paid" : "Unpaid"}</td>
                  <td className="px-4 py-3 font-semibold">{currency}{Number(o.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}

              {(data.orders || []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-950/40 transition"
              >
                <ChevronLeftIcon size={14} /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-950/40 transition"
              >
                Next <ChevronRightIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

