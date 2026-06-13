"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { StarIcon } from "lucide-react";

function classNames(...args) {
  return args.filter(Boolean).join(" ");
}

function formatPrice(value, currency = "₦") {
  const num = Number(value) || 0;
  return `${currency}${num.toLocaleString()}`;
}

const PAGE_SIZE = 40;

const InfiniteProductsGrid = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loaderRef = useRef(null);

  const fetchPage = useCallback(
    async (pageToLoad) => {
      if (loading || !hasMore) return;

      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/products?page=${pageToLoad}&limit=${PAGE_SIZE}`
        );
        if (!res.ok) {
          throw new Error("Failed to load products");
        }

        const data = await res.json();
        const newItems = data.items || data.products || [];

        setItems((prev) => [...prev, ...newItems]);

        if (!newItems.length || newItems.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } catch (err) {
        setError(err.message || "Error loading products");
      } finally {
        setLoading(false);
      }
    },
    [loading, hasMore]
  );

  // First load
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return;
    const node = loaderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading]);

  // Fetch subsequent pages
  useEffect(() => {
    if (page === 1) return;
    fetchPage(page);
  }, [page, fetchPage]);

  if (!items.length && loading) {
    return (
      <div className="mx-auto flex max-w-7xl justify-center py-10">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading products…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold sm:text-lg">
          Recommended for you
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Scroll to see more
        </span>
      </header>

      {/* Dense product grid similar to large marketplaces */}
      <div className="grid grid-cols-2 gap-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.slug || p.id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-purple-500/60 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
              {p.images?.[0] ? (
                <Image
                  src={p.images[0]}
                  alt={p.name || "Product"}
                  fill
                  sizes="(max-width: 768px) 50vw, 16vw"
                  className="object-cover object-center transition duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                  No image
                </div>
              )}
              {p.discountPercent > 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  −{Math.round(p.discountPercent)}%
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2">
              <p className="line-clamp-2 text-[11px] font-medium text-slate-800 dark:text-slate-100">
                {p.name}
              </p>

              {p.rating && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <StarIcon
                    size={11}
                    className="text-amber-400"
                    aria-hidden
                  />
                  <span>{p.rating.toFixed ? p.rating.toFixed(1) : p.rating}</span>
                  {p.ratingCount ? <span>({p.ratingCount})</span> : null}
                </div>
              )}

              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  {formatPrice(p.price, p.currencySymbol || "₦")}
                </span>
                {p.oldPrice && p.oldPrice > p.price && (
                  <span className="text-[10px] text-slate-400 line-through">
                    {formatPrice(p.oldPrice, p.currencySymbol || "₦")}
                  </span>
                )}
              </div>

              {p.badge && (
                <span className="mt-1 inline-flex w-fit rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                  {p.badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Loader / status row */}
      <div ref={loaderRef} className="flex justify-center py-6">
        {loading && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Loading more products…
          </p>
        )}
        {error && !loading && (
          <button
            type="button"
            onClick={() => fetchPage(page)}
            className="text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400"
          >
            Failed to load. Tap to retry.
          </button>
        )}
        {!hasMore && !loading && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            You’ve reached the end.
          </p>
        )}
      </div>
    </div>
  );
};

export default InfiniteProductsGrid;
