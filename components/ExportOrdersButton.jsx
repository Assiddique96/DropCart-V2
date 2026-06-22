'use client'
/**
 * ExportOrdersButton
 *
 * Usage (seller):
 *   <ExportOrdersButton endpoint="/api/store/orders-export" getHeaders={getStoreAuthHeaders} />
 *
 * Usage (admin):
 *   <ExportOrdersButton endpoint="/api/admin/orders-export" token={adminToken} />
 */
import { useState } from "react"
import { DownloadIcon, CalendarIcon } from "lucide-react"

export default function ExportOrdersButton({
  /** API endpoint that streams a CSV */
  endpoint,
  /** async fn → Headers object (for seller) */
  getHeaders,
  /** raw Bearer token string (for admin) */
  token,
  label = "Export CSV",
}) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  const doExport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      if (status) params.set("status", status)

      let headers = {}
      if (getHeaders) {
        headers = await getHeaders()
      } else if (token) {
        headers = { Authorization: `Bearer ${token}` }
      }

      const res = await fetch(`${endpoint}?${params}`, { headers })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed" }))
        throw new Error(err.error || "Export failed")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const contentDisposition = res.headers.get("Content-Disposition") ?? ""
      const filename =
        contentDisposition.match(/filename="(.+)"/)?.[1] ??
        `orders-${new Date().toISOString().slice(0, 10)}.csv`
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setOpen(false)
    } catch (err) {
      alert(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-300 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
      >
        <DownloadIcon size={13} /> {label}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 w-72">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
            <CalendarIcon size={13} /> Export orders
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">From date</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">To date</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Status filter (optional)</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
                <option value="">All statuses</option>
                <option value="ORDER_PLACED">Order Placed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={doExport} disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-xs rounded-lg hover:bg-slate-900 transition disabled:opacity-50 font-semibold">
                <DownloadIcon size={12} /> {loading ? "Exporting..." : "Download CSV"}
              </button>
              <button onClick={() => setOpen(false)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
