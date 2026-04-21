'use client'
import { useEffect, useState } from "react"
import Loading from "@/components/Loading"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import { XCircleIcon, TruckIcon, PackageCheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { isOrderConsideredPaid } from "@/lib/orderPayment"

const STATUS_COLORS = {
    ORDER_PLACED: 'bg-blue-50 text-blue-700',
    PROCESSING:   'bg-yellow-50 text-yellow-700',
    SHIPPED:      'bg-purple-50 text-purple-700',
    DELIVERED:    'bg-green-50 text-green-700',
    CANCELLED:    'bg-red-50 text-red-500',
}

export default function StoreOrders() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [cancelModal, setCancelModal] = useState(null)
    const [cancelReason, setCancelReason] = useState('')
    const [cancelling, setCancelling] = useState(false)
    const [fulfillmentOpen, setFulfillmentOpen] = useState(null)
    const [fulfillQty, setFulfillQty] = useState({})
    const [submitting, setSubmitting] = useState(false)

    const { getToken } = useAuth()

    const fetchOrders = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get("/api/store/orders", { headers: { Authorization: `Bearer ${token}` } })
            const fresh = data.orders
            setOrders(fresh)
        } catch (e) {
            toast.error(e?.response?.data?.error || e.message)
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (orderId, status) => {
        try {
            const token = await getToken()
            const { data } = await axios.post(
                "/api/store/update-order-status",
                { orderId, status },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            const updated = data?.updatedOrder

            setOrders(prev => prev.map(o => {
                if (o.id !== orderId) return o
                const next = {
                    ...o,
                    status,
                    trackingNumber: updated?.trackingNumber ?? o.trackingNumber,
                }
                return { ...next, isPaid: isOrderConsideredPaid(next) }
            }))
            if (selectedOrder?.id === orderId) {
                const next = {
                    ...selectedOrder,
                    status,
                    trackingNumber: updated?.trackingNumber ?? selectedOrder.trackingNumber,
                }
                setSelectedOrder({ ...next, isPaid: isOrderConsideredPaid(next) })
            }
            toast.success("Status updated")
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
    }

    const saveFulfillment = async (order) => {
        setSubmitting(true)
        try {
            const token = await getToken()
            const items = order.orderItems.map(item => ({
                productId: item.productId,
                fulfilledQuantity: parseInt(fulfillQty[`${order.id}_${item.productId}`] ?? item.fulfilledQuantity ?? 0),
            }))
            const { data } = await axios.post("/api/store/fulfill", { orderId: order.id, items }, { headers: { Authorization: `Bearer ${token}` } })
            toast.success(data.message)
            if (data.newStatus !== order.status) {
                setOrders(prev => prev.map(o => {
                    if (o.id !== order.id) return o
                    const next = { ...o, status: data.newStatus }
                    return { ...next, isPaid: isOrderConsideredPaid(next) }
                }))
                if (selectedOrder?.id === order.id) {
                    const next = { ...selectedOrder, status: data.newStatus }
                    setSelectedOrder({ ...next, isPaid: isOrderConsideredPaid(next) })
                }
            }
            setFulfillmentOpen(null)
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
        setSubmitting(false)
    }

    const cancelOrder = async () => {
        if (!cancelModal) return
        setCancelling(true)
        try {
            const token = await getToken()
            await axios.post("/api/orders/cancel", { orderId: cancelModal.id, reason: cancelReason }, { headers: { Authorization: `Bearer ${token}` } })
            toast.success("Order cancelled")
            setOrders(prev => prev.map(o => o.id === cancelModal.id ? { ...o, status: "CANCELLED" } : o))
            if (selectedOrder?.id === cancelModal.id) setSelectedOrder(p => ({ ...p, status: "CANCELLED" }))
            setCancelModal(null); setCancelReason('')
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
        setCancelling(false)
    }

    useEffect(() => { fetchOrders() }, [])

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Store <span className="text-slate-800 font-medium">Orders</span></h1>

            {orders.length === 0 ? (
                <p className="text-slate-400">No orders yet.</p>
            ) : (
                <div className="space-y-3 max-w-5xl">
                    {orders.map((order, index) => (
                        <div key={order.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            {/* Order header row */}
                            <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-slate-50 text-xs text-slate-500 cursor-pointer"
                                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}>
                                <span className="font-medium text-slate-700">#{index + 1}</span>
                                <span>{order.user?.name}</span>
                                <span className="font-semibold text-slate-800">{currency}{order.total.toLocaleString()}</span>
                                <span>{order.paymentMethod}{isOrderConsideredPaid(order) ? ' ✓' : ''}</span>
                                {order.trackingNumber && (
                                    <span className="flex items-center gap-1 text-purple-600">
                                        <TruckIcon size={11} /> {order.trackingNumber}
                                    </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                                    {order.status.replace('_', ' ')}
                                </span>
                                <span className="ml-auto text-slate-300">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>

                            {/* Expanded detail */}
                            {selectedOrder?.id === order.id && (
                                <div className="px-4 py-4 text-sm text-slate-600 border-t border-slate-100 space-y-4">

                                    {/* Customer + Address */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Customer</p>
                                            <p>{order.user?.name}</p>
                                            <p className="text-slate-400 text-xs">{order.user?.email}</p>
                                            <p className="text-slate-400 text-xs">{order.address?.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Ship To</p>
                                            <p className="text-xs text-slate-500">
                                                {order.address?.street}, {order.address?.city}, {order.address?.state} {order.address?.zip}, {order.address?.country}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Order notes */}
                                    {order.notes && (
                                        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
                                            <span className="font-semibold">Buyer note: </span>{order.notes}
                                        </div>
                                    )}

                                    {/* Items */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Items</p>
                                        <div className="space-y-2">
                                            {order.orderItems.map((item, i) => (
                                                <div key={i} className="flex items-center gap-3 border border-slate-100 rounded-lg p-2">
                                                    <img src={item.product?.images?.[0]} alt="" className="w-12 h-12 object-cover rounded" />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-slate-700">{item.product?.name}</p>
                                                        <p className="text-xs text-slate-400">
                                                            Qty: {item.quantity} × {currency}{item.price}
                                                            {item.fulfilledQuantity > 0 && (
                                                                <span className="ml-2 text-green-600">({item.fulfilledQuantity} fulfilled)</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <p className="font-semibold text-slate-800 text-sm">{currency}{(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions row */}
                                    {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                                        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                                            {/* Status selector */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">Status:</span>
                                                <select value={order.status}
                                                    onChange={e => updateStatus(order.id, e.target.value)}
                                                    className="border border-slate-200 rounded text-xs p-1.5 outline-none">
                                                    <option value="ORDER_PLACED">ORDER PLACED</option>
                                                    <option value="PROCESSING">PROCESSING</option>
                                                    <option value="SHIPPED">SHIPPED</option>
                                                    <option value="DELIVERED">DELIVERED</option>
                                                </select>
                                            </div>

                                            {/* Tracking number (read-only, auto-generated on SHIPPED) */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">Tracking:</span>
                                                <span className="text-xs font-semibold text-purple-700">
                                                    {order.trackingNumber || "Auto-generated on SHIPPED"}
                                                </span>
                                            </div>

                                            {/* Partial fulfillment */}
                                            <button
                                                onClick={() => {
                                                    const isOpen = fulfillmentOpen === order.id
                                                    setFulfillmentOpen(isOpen ? null : order.id)
                                                    if (!isOpen) {
                                                        const initial = {}
                                                        order.orderItems.forEach(i => { initial[`${order.id}_${i.productId}`] = i.fulfilledQuantity ?? 0 })
                                                        setFulfillQty(p => ({ ...p, ...initial }))
                                                    }
                                                }}
                                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition">
                                                <PackageCheckIcon size={11} />
                                                Fulfillment
                                                {fulfillmentOpen === order.id ? <ChevronUpIcon size={11} /> : <ChevronDownIcon size={11} />}
                                            </button>

                                            {/* Cancel */}
                                            {!['SHIPPED'].includes(order.status) && (
                                                <button onClick={() => setCancelModal(order)}
                                                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition ml-auto">
                                                    <XCircleIcon size={13} /> Cancel Order
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Fulfillment panel */}
                                    {fulfillmentOpen === order.id && (
                                        <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                                            <p className="text-xs font-semibold text-slate-500 mb-3">Mark Fulfilled Quantities</p>
                                            <div className="space-y-2">
                                                {order.orderItems.map(item => (
                                                    <div key={item.productId} className="flex items-center gap-3">
                                                        <span className="text-xs flex-1 text-slate-700 truncate">{item.product?.name}</span>
                                                        <span className="text-xs text-slate-400">of {item.quantity}</span>
                                                        <input
                                                            type="number" min={0} max={item.quantity}
                                                            value={fulfillQty[`${order.id}_${item.productId}`] ?? 0}
                                                            onChange={e => setFulfillQty(p => ({ ...p, [`${order.id}_${item.productId}`]: e.target.value }))}
                                                            className="border border-slate-200 rounded p-1 text-xs w-16 outline-none text-center"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={() => saveFulfillment(order)} disabled={submitting}
                                                className="mt-3 flex items-center gap-1.5 text-xs px-4 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-900 transition disabled:opacity-50">
                                                <PackageCheckIcon size={12} /> {submitting ? "Saving..." : "Save Fulfillment"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Cancel modal */}
            {cancelModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">Cancel Order?</h3>
                        <p className="text-sm text-slate-500 mb-3">Shipped orders cannot be cancelled.</p>
                        <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                            placeholder="Reason for cancellation (optional)" rows={3}
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none resize-none mb-4" />
                        <div className="flex gap-3">
                            <button onClick={cancelOrder} disabled={cancelling}
                                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition disabled:opacity-50">
                                {cancelling ? "Cancelling..." : "Confirm Cancel"}
                            </button>
                            <button onClick={() => { setCancelModal(null); setCancelReason('') }}
                                className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-200 transition">
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
