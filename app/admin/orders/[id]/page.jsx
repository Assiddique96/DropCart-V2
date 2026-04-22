'use client'
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import Link from "next/link"
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react"

export default function AdminOrderDetailPage({ params }) {
  const { getToken } = useAuth()
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$"

  const id = params?.id
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)

  const totals = useMemo(() => {
    if (!order?.orderItems?.length) return { items: 0, qty: 0 }
    const items = order.orderItems.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0)
    const qty = order.orderItems.reduce((s, it) => s + (it.quantity || 0), 0)
    return { items, qty }
  }, [order])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const { data } = await axios.get(`/api/admin/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setOrder(data.order)
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (id) fetchOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <Loading />
  if (!order) {
    return (
      <div className="text-slate-500 dark:text-slate-300 mb-28">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline">
            <ArrowLeftIcon size={16} /> Back to orders
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6">
          Order not found.
        </div>
      </div>
    )
  }

  return (
    <div className="text-slate-500 dark:text-slate-300 mb-28">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="min-w-0">
          <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline">
            <ArrowLeftIcon size={16} /> Back to orders
          </Link>
          <h1 className="text-2xl mt-2 text-slate-800 dark:text-slate-100 truncate">
            Order {String(order.id).slice(0, 10)}…
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(order.createdAt).toLocaleString()} · {String(order.status || "").replaceAll("_", " ")} · {order.isPaid ? "Paid" : "Unpaid"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/shop/${order.store?.username || ""}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-950/40 transition"
          >
            View store <ExternalLinkIcon size={14} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-800/80">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Items</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-400">
              {totals.qty} item{totals.qty !== 1 ? "s" : ""} · Subtotal {currency}{totals.items.toLocaleString()}
            </p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(order.orderItems || []).map((it) => (
              <div key={`${it.orderId}-${it.productId}`} className="px-5 py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {it.product?.name || "Product"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    Qty {it.quantity} · {currency}{Number(it.price || 0).toLocaleString()} each
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {currency}{Number((it.price || 0) * (it.quantity || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {(order.orderItems || []).length === 0 && (
              <div className="px-5 py-6 text-sm text-slate-400">No items.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Summary</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-300">Payment</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{String(order.paymentMethod || "—")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-300">Total</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{currency}{Number(order.total || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-300">Tracking</span>
                <span className="text-slate-800 dark:text-slate-100">{order.trackingNumber || "—"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Customer</p>
            <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">{order.user?.name || "—"}</p>
            <p className="text-xs text-slate-400">{order.user?.email || "—"}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Store</p>
            <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">{order.store?.name || "—"}</p>
            <p className="text-xs text-slate-400">@{order.store?.username || "—"}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Shipping address</p>
            {order.address ? (
              <div className="mt-2 text-sm text-slate-700 dark:text-slate-200 space-y-1">
                <p>{order.address?.name}</p>
                <p className="text-xs text-slate-400">{order.address?.email}</p>
                <p className="text-xs text-slate-400">{order.address?.phone}</p>
                <p>
                  {[order.address?.address, order.address?.city, order.address?.state, order.address?.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">—</p>
            )}
          </div>

          {order.refund && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Refund</p>
              <p className="mt-2 text-xs text-slate-400">Status</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{order.refund.status}</p>
              <p className="mt-2 text-xs text-slate-400">Reason</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{order.refund.reason}</p>
              {order.refund.amount != null && (
                <>
                  <p className="mt-2 text-xs text-slate-400">Amount</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{currency}{Number(order.refund.amount).toLocaleString()}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

