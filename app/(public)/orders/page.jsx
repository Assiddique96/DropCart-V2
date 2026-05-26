"use client";
import { useEffect, useState, Suspense } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/Loading";
import toast from "react-hot-toast";
import {
  XCircleIcon,
  RotateCcwIcon,
  TruckIcon,
  RefreshCwIcon,
  DownloadIcon,
} from "lucide-react";
import { useSelector } from "react-redux";
import { isOrderConsideredPaid } from "@/lib/orderPayment";
import RatingModal from "@/components/RatingModal";
import Rating from "@/components/Rating";
import { shortenId } from "@/lib/format";

const STATUS_COLORS = {
  ORDER_PLACED: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  PROCESSING: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  SHIPPED: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  DELIVERED: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  CANCELLED: "bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_STEPS = ["ORDER_PLACED", "PROCESSING", "SHIPPED", "DELIVERED"];

function OrdersContent() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { ratings } = useSelector((state) => state.rating);
  const searchParams = useSearchParams();
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₦";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [refundModal, setRefundModal] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [retrying, setRetrying] = useState(null);
  const [ratingModal, setRatingModal] = useState(null);

  // Handle Stripe/Paystack/Flutterwave return
  useEffect(() => {
    const payment = searchParams.get("payment");
    const transactionId = searchParams.get("transaction_id");
    const txRef = searchParams.get("tx_ref");

    const verifyFlutterwave = async () => {
      try {
        const query = transactionId
          ? `transaction_id=${transactionId}`
          : txRef
          ? `tx_ref=${encodeURIComponent(txRef)}`
          : null;
        if (!query) {
          toast.success("Payment successful! Your order is confirmed.");
          return;
        }

        const { data } = await axios.get(`/api/flutterwave?${query}`);
        if (data.paid) {
          toast.success("Payment successful! Your order is confirmed.");
        } else {
          toast.error(
            "Payment succeeded but verification did not complete. Please contact support.",
          );
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.error ||
            "Unable to verify payment. Please contact support.",
        );
      }
    };

    if (payment === "success") {
      verifyFlutterwave();
    }
    if (payment === "cancelled")
      toast.error(
        "Payment cancelled. Your order is still saved — retry from here.",
      );
  }, [searchParams]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/");
      return;
    }
    (async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(data.orders);
      } catch (e) {
        toast.error(e?.response?.data?.error || e.message);
      }
      setLoading(false);
    })();
  }, [isLoaded, user]);

  const cancelOrder = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      const token = await getToken();
      await axios.post(
        "/api/orders/cancel",
        { orderId: cancelModal.id, reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Order cancelled.");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelModal.id ? { ...o, status: "CANCELLED" } : o,
        ),
      );
      setCancelModal(null);
      setCancelReason("");
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message);
    }
    setCancelling(false);
  };

  const requestRefund = async () => {
    if (!refundModal) return;
    if (!refundReason.trim())
      return toast.error("Please provide a reason for your refund request.");
    setRefunding(true);
    try {
      const token = await getToken();
      await axios.post(
        "/api/orders/refund",
        { orderId: refundModal.id, reason: refundReason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(
        "Refund request submitted. We will review it within 2 business days.",
      );
      setRefundModal(null);
      setRefundReason("");
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message);
    }
    setRefunding(false);
  };

  const retryPayment = async (order) => {
    setRetrying(order.id);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/orders/retry-payment",
        { orderId: order.id },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      window.location.href = data.redirectUrl;
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message);
    }
    setRetrying(null);
  };

  const downloadInvoice = (orderId) => {
    window.open(`/api/orders/invoice?orderId=${orderId}&print=1`, "_blank");
  };

  if (!isLoaded || loading) return <Loading />;

  return (
    <div className="min-h-[70vh] mx-6 mb-24 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <div className="max-w-4xl mx-auto my-12">
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-slate-700 dark:text-slate-50">
            My Orders
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-slate-400 dark:text-slate-500">
            <p className="text-xl font-medium">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const stepIndex = STATUS_STEPS.indexOf(order.status);
              const paid = isOrderConsideredPaid(order);
              const showRetry =
                !paid &&
                order.paymentMethod !== "COD" &&
                order.status !== "CANCELLED";

              return (
                <div
                  key={order.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900/70"
                >
                  {/* Header row */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 px-5 py-3 text-xs text-slate-500 dark:text-slate-300 cursor-pointer"
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                  >
                    <div className="flex gap-4 flex-wrap">
                      <span>
                        Order:{" "}
                        <b className="text-slate-700 dark:text-slate-100">#{shortenId(order.id)}</b>
                      </span>
                      <span>
                        Placed:{" "}
                        <b className="text-slate-700 dark:text-slate-100">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </b>
                      </span>
                      <span>
                        Total:{" "}
                        <b className="text-slate-700 dark:text-slate-100">
                          {currency}
                          {order.total.toLocaleString()}
                        </b>
                      </span>
                      <span
                        className={
                          paid
                            ? "text-green-600 dark:text-green-400 font-medium"
                            : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        {order.paymentMethod}{" "}
                        {paid ? "(Paid ✓)" : "(Unpaid)"}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 flex-wrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={`px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}
                      >
                        {order.status.replace("_", " ")}
                      </span>

                      {/* Retry payment */}
                      {showRetry && (
                        <button
                          onClick={() => retryPayment(order)}
                          disabled={retrying === order.id}
                          className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition disabled:opacity-50"
                        >
                          <RefreshCwIcon
                            size={12}
                            className={
                              retrying === order.id ? "animate-spin" : ""
                            }
                          />
                          {retrying === order.id
                            ? "Redirecting..."
                            : "Pay Now"}
                        </button>
                      )}

                      {/* Invoice download */}
                      <button
                        onClick={() => downloadInvoice(order.id)}
                        className="flex items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition"
                      >
                        <DownloadIcon size={12} /> Invoice
                      </button>

                      {/* Cancel */}
                      {order.status === "ORDER_PLACED" && (
                        <button
                          onClick={() => setCancelModal(order)}
                          className="flex items-center gap-1 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition"
                        >
                          <XCircleIcon size={12} /> Cancel
                        </button>
                      )}

                      {/* Refund */}
                      {order.status === "DELIVERED" && (
                        <button
                          onClick={() => setRefundModal(order)}
                          className="flex items-center gap-1 text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition"
                        >
                          <RotateCcwIcon size={12} /> Refund
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress tracker */}
                  {!["CANCELLED"].includes(order.status) && (
                    <div className="px-5 pt-3 pb-1">
                      <div className="flex items-center">
                        {STATUS_STEPS.map((step, i) => {
                          const done = stepIndex >= i;
                          const last = i === STATUS_STEPS.length - 1;
                          return (
                            <div
                              key={step}
                              className="flex items-center flex-1 last:flex-none"
                            >
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  done
                                    ? "bg-green-500 text-white"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-300"
                                }`}
                              >
                                {done ? "✓" : i + 1}
                              </div>
                              <span
                                className={`text-[10px] ml-1 hidden sm:inline ${
                                  done
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-slate-400 dark:text-slate-500"
                                }`}
                              >
                                {step.replace("_", " ")}
                              </span>
                              {!last && (
                                <div
                                  className={`flex-1 h-0.5 mx-2 ${
                                    stepIndex > i
                                      ? "bg-green-400"
                                      : "bg-slate-200 dark:bg-slate-700"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {order.orderItems
                      .slice(0, isExpanded ? undefined : 2)
                      .map((item, i) => {
                        const existingRating = ratings.find(
                          (r) =>
                            r.orderId === order.id &&
                            r.productId === item.productId,
                        );
                        return (
                          <div
                            key={`${order.id}-${item.productId}-${i}`}
                            className="flex flex-wrap items-center gap-3 px-5 py-3"
                          >
                            <img
                              src={item.product?.images?.[0]}
                              alt=""
                              className="w-12 h-12 object-cover rounded border border-slate-100 dark:border-slate-700 shrink-0"
                            />
                            <div className="flex-1 min-w-0 text-sm text-slate-700 dark:text-slate-100">
                              <p className="font-medium">
                                {item.product?.name}
                              </p>
                              <p className="text-slate-400 dark:text-slate-500 text-xs">
                                Qty: {item.quantity} × {currency}
                                {item.price}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-auto">
                              <p className="font-semibold text-slate-800 dark:text-slate-50 text-sm">
                                {currency}
                                {(item.price * item.quantity).toLocaleString()}
                              </p>
                              {order.status === "DELIVERED" && (
                                <div
                                  className="flex flex-col items-end gap-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {existingRating ? (
                                    <div className="flex flex-col items-end gap-0.5">
                                      <Rating value={existingRating.rating} />
                                      <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                                        Review submitted
                                      </span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRatingModal({
                                          orderId: order.id,
                                          productId: item.productId,
                                        })
                                      }
                                      className="text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 px-2.5 py-1.5 rounded-lg border border-green-200/80 dark:border-green-700/60 transition"
                                    >
                                      Rate product
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {!isExpanded && order.orderItems.length > 2 && (
                      <button
                        onClick={() => setExpandedOrder(order.id)}
                        className="w-full text-center text-xs text-slate-400 dark:text-slate-500 py-2 hover:text-slate-600 dark:hover:text-slate-300 transition"
                      >
                        +{order.orderItems.length - 2} more item
                        {order.orderItems.length - 2 > 1 ? "s" : ""} — click to
                        expand
                      </button>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-200 space-y-3">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Delivery Address
                          </p>
                          <p className="text-xs">
                            {order.address?.name}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {order.address?.street},{" "}
                            {order.address?.city},{" "}
                            {order.address?.state}{" "}
                            {order.address?.zip}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {order.address?.country}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {order.address?.phone}
                          </p>
                        </div>
                        {order.trackingNumber && (
                          <div>
                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">
                              Tracking
                            </p>
                            <p className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-mono text-xs">
                              <TruckIcon size={12} />{" "}
                              {order.trackingNumber}
                            </p>
                          </div>
                        )}
                      </div>
                      {order.notes && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                          <span className="font-semibold">
                            Your note:{" "}
                          </span>
                          {order.notes}
                        </div>
                      )}
                      {order.isCouponUsed && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Coupon applied: {order.coupon?.code} (
                          {order.coupon?.discount}% off)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-50 mb-1">
              Cancel Order?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-300 mb-3">
              Only orders that haven't been processed yet can be cancelled.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none resize-none mb-4 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
            <div className="flex gap-3">
              <button
                onClick={cancelOrder}
                disabled={cancelling}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
              <button
                onClick={() => {
                  setCancelModal(null);
                  setCancelReason("");
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}

      {ratingModal && (
        <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />
      )}

      {/* Refund modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-50 mb-1">
              Request a Refund
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-300 mb-3">
              Describe why you'd like a refund. Our team will review it within 2
              business days.
            </p>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Item arrived damaged, wrong item received..."
              rows={4}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none resize-none mb-4 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
            <div className="flex gap-3">
              <button
                onClick={requestRefund}
                disabled={refunding}
                className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm hover:bg-amber-600 transition disabled:opacity-50"
              >
                {refunding ? "Submitting..." : "Submit Request"}
              </button>
              <button
                onClick={() => {
                  setRefundModal(null);
                  setRefundReason("");
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OrdersContent />
    </Suspense>
  );
}
