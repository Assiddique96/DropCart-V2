'use client'

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function TrackPage() {
  const searchParams = useSearchParams();
  const initial = useMemo(() => (searchParams.get("t") || "").toUpperCase(), [searchParams]);

  const [trackingNumber, setTrackingNumber] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  const lookup = async (t) => {
    const tn = (t || "").trim().toUpperCase();
    setError("");
    setOrder(null);
    if (!tn) {
      setError("Enter a tracking number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/track?trackingNumber=${encodeURIComponent(tn)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to find that tracking number.");
      setOrder(data.order);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const statusLabel = (s) => (s || "").toString().replace(/_/g, " ").toLowerCase();

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-900">Track your order</h1>
      <p className="text-slate-500 mt-2">
        Enter your 6-character tracking number to see the latest status.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(trackingNumber);
        }}
        className="mt-6 flex flex-col sm:flex-row gap-3"
      >
        <input
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
          placeholder="e.g. A1B2C3"
          maxLength={32}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold"
        >
          {loading ? "Searching..." : "Track"}
        </button>
      </form>

      {error && (
        <div className="mt-5 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {order && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Tracking number</p>
              <p className="text-lg font-semibold text-slate-900">{order.trackingNumber}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-widest text-slate-400">Status</p>
              <p className="text-lg font-semibold text-slate-900">{statusLabel(order.status)}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs uppercase tracking-widest text-slate-400">Store</p>
              <p className="text-sm font-medium text-slate-800">{order.store?.name || "—"}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs uppercase tracking-widest text-slate-400">Last updated</p>
              <p className="text-sm font-medium text-slate-800">
                {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "—"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Items</p>
            <div className="space-y-3">
              {(order.orderItems || []).map((it, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {it.product?.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.product.images[0]} alt={it.product?.name || "Item"} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{it.product?.name || "Item"}</p>
                    <p className="text-xs text-slate-500">Qty: {it.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

