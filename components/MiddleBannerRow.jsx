"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { assets } from "@/assets/assets";

// Reuse the same image validity check you use elsewhere
function isValidImageSrc(src) {
  if (src == null) return false;
  if (typeof src === "string") return src.trim() !== "";
  return true;
}

/**
 * AliExpress-like middle banner row:
 *  - One large banner on the left (size: "lg")
 *  - Two small rotating banners on the right (size: "sm")
 *
 * Props:
 *  - banners: array of { id, size: "lg" | "sm", title, subtitle, cta, href, image }
 */
const MiddleBannerRow = ({ banners }) => {
  const [index, setIndex] = useState(0);

  if (!banners || banners.length === 0) return null;

  // Large banner: first with size "lg" or first item as fallback
  const large = banners.find((b) => b.size === "lg") || banners[0];
  // Small banners: everything except the large one
  const small = banners.filter((b) => b.id !== large.id);

  const next = () => {
    if (small.length === 0) return;
    setIndex((i) => (i + 1) % small.length);
  };

  const prev = () => {
    if (small.length === 0) return;
    setIndex((i) => (i - 1 + small.length) % small.length);
  };

  const smallView =
    small.length <= 1
      ? small
      : [small[index], small[(index + 1) % small.length]];

  return (
    <div className="mx-auto mt-5 flex max-w-7xl flex-col gap-3 md:flex-row">
      {/* Large banner */}
      <Link
        href={large.href || "/shop"}
        className="group relative flex-1 overflow-hidden rounded-3xl bg-slate-100 shadow-sm dark:bg-slate-900"
      >
        {isValidImageSrc(large.image) && (
          <Image
            src={large.image}
            alt={large.title || "Flash deals"}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1280px) 100vw, 640px"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" />
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">
              Flash deals
            </p>
            <h2 className="max-w-md text-lg font-semibold text-white drop-shadow-md sm:text-xl lg:text-2xl">
              {large.title || "Limited-time offers"}
            </h2>
            {large.subtitle && (
              <p className="max-w-md text-[11px] text-white/85 sm:text-xs">
                {large.subtitle}
              </p>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-white sm:text-xs">
            <span>{large.cta || "View deals"}</span>
            <ArrowRightIcon size={16} />
          </div>
        </div>
      </Link>

      {/* Small banners (carousel-style pair) */}
      <div className="relative flex w-full flex-col gap-3 md:w-[280px]">
        <div className="flex flex-col gap-3">
          {smallView.map((b) => (
            <Link
              key={b.id}
              href={b.href || "/shop"}
              className="group relative h-[90px] overflow-hidden rounded-2xl bg-slate-100 shadow-sm dark:bg-slate-900"
            >
              {isValidImageSrc(b.image) && (
                <Image
                  src={b.image}
                  alt={b.title || "Promo"}
                  fill
                  className="object-cover object-center"
                  sizes="280px"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/30" />
              <div className="absolute inset-0 z-10 flex flex-col justify-center p-3">
                <h3 className="line-clamp-1 text-xs font-semibold text-white sm:text-sm">
                  {b.title || "Special offer"}
                </h3>
                {b.subtitle && (
                  <p className="mt-1 line-clamp-2 text-[10px] text-white/85 sm:text-[11px]">
                    {b.subtitle}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-white/90">
                  <span>{b.cta || "View more"}</span>
                  <ArrowRightIcon size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
        {small.length > 2 && (
          <div className="absolute inset-y-0 right-1 flex flex-col justify-center gap-1">
            <button
              type="button"
              onClick={prev}
              className="rounded-full bg-black/25 p-1 text-white shadow hover:bg-black/40"
              aria-label="Previous banner"
            >
              <ChevronLeftIcon size={14} />
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-full bg-black/25 p-1 text-white shadow hover:bg-black/40"
              aria-label="Next banner"
            >
              <ChevronRightIcon size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const defaultMiddleBanners = [
  {
    id: 1,
    size: "lg",
    title: "Flash deals for SMEs",
    subtitle: "Limited‑time bulk discounts on core gadgets",
    cta: "Browse flash deals",
    href: "/flash-deals",
    image: assets.hero_product_img1,
  },
  {
    id: 2,
    size: "sm",
    title: "International shipping",
    subtitle: "Malta & EU warehouse for cross‑border orders",
    cta: "View options",
    href: "/intl-shipping",
    image: assets.hero_product_img2,
  },
  {
    id: 3,
    size: "sm",
    title: "Installment plans",
    subtitle: "Flexible financing for growing businesses",
    cta: "Check eligibility",
    href: "/installments",
    image: assets.hero_model_img,
  },
];

export default MiddleBannerRow;
