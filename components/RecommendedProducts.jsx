// components/RecommendedProducts.jsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";

export default function RecommendedProducts({ currentProductId = null }) {
  const user = useSelector((state) => state?.auth?.user ?? null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = new URLSearchParams();
        if (user?.id) params.set("userId", user.id);
        if (currentProductId) params.set("productId", currentProductId);

        const res = await fetch(`/api/recommendations?${params.toString()}`);
        const data = await res.json();
        if (!cancelled) setItems(data?.products || []);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, currentProductId]);

  if (!items.length) return null;

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold mb-3">
        Recommended for you
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="group rounded-xl border border-slate-200 dark:border-slate-700 p-2 hover:-translate-y-0.5 transition bg-white dark:bg-slate-900"
          >
            {p.images?.[0] && (
              <div className="relative w-full h-32 mb-2">
                <Image
                  src={p.images[0]}
                  alt={p.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}
            <p className="text-sm font-semibold line-clamp-2 text-slate-800 dark:text-slate-200">
              {p.name}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              {p.brand}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
              ₦{p.price.toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
