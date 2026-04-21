'use client'

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/**
 * CORE LOGIC COMPONENT
 * We move the tracking logic here because useSearchParams() hooks 
 * into the request's URL. During the Vercel build (prerendering), 
 * there is no "URL" with params, so this must be wrapped in Suspense.
 */
function TrackContent() {
  const searchParams = useSearchParams();
  
  // Memoize the initial tracking number from the URL (?t=A1B2C3)
  const initial = useMemo(() => (searchParams.get("t") || "").toUpperCase(), [searchParams]);

  const [trackingNumber, setTrackingNumber] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  /**
   * Hits the API route analyzed previously.
   * Handles sanitization and state updates for the UI.
   */
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
      // We use a relative path; Next.js handles the domain automatically
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

  // If a user lands on the page with ?t=... already in the URL, trigger lookup immediately
  useEffect(() => {
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  // UI helper for formatting DB enums (e.g., "OUT_FOR_DELIVERY" -> "out for delivery")
  const statusLabel = (s) => (s || "").toString().replace(/_/g, " ").toLowerCase();

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-900">Track your order</h1>
      <p className="text-slate-500 mt-2">
        Enter your 6-character tracking number to see the latest status.
      </p>

      {/* Input Form */}
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
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold transition-colors"
        >
          {loading ? "Searching..." : "Track"}
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div className="mt-5 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {/* Result Display */}
      {order && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Tracking number</p>
              <p className="text-lg font-semibold text-slate-900">{order.trackingNumber}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-widest text-slate-400">Status</p>
              <p className="text-lg font-semibold text-indigo-600 capitalize">{statusLabel(order.status)}</p>
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

          {/* Items List */}
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Items</p>
            <div className="space-y-3">
              {(order.orderItems || []).map((it, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {it.product?.images?.[0] ? (
                      // Next.js Image component is preferred, but img works for external blobs
                      <img 
                        src={it.product.images[0]} 
                        alt={it.product?.name || "Item"} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-[10px] text-slate-400">No Image</div>
                    )}
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

/**
 * MAIN EXPORT
 * Wrapping the component in Suspense ensures that Vercel's build
 * doesn't fail when trying to pre-render the useSearchParams hook.
 */
export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-6 py-20 text-center text-slate-500">
        Loading tracker...
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}