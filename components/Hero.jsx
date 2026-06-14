"use client";

import { assets } from "@/assets/assets";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import CategoriesMarquee from "./CategoriesMarquee";

function isValidImageSrc(src) {
  if (src == null) return false;
  if (typeof src === "string") return src.trim() !== "";
  return true;
}

/** Primary image of the product with the highest average rating (tie-break: more reviews). */
function getTopRatedPrimaryImage(products) {
  if (!Array.isArray(products) || products.length === 0) return null;
  const scored = [];
  for (const p of products) {
    const rs = p.rating;
    if (!Array.isArray(rs) || rs.length === 0) continue;
    const img = p.images?.[0];
    if (!img) continue;
    const sum = rs.reduce((s, r) => s + (Number(r.rating) || 0), 0);
    const avg = sum / rs.length;
    scored.push({ avg, n: rs.length, img });
  }
  if (scored.length === 0) return null;
  scored.sort((a, b) => b.avg - a.avg || b.n - a.n);
  return scored[0].img;
}

/** Primary image of the product with the largest discount vs MRP (tie-break: larger absolute saving). */
function getTopDiscountPrimaryImage(products) {
  if (!Array.isArray(products) || products.length === 0) return null;
  const scored = [];
  for (const p of products) {
    const mrp = Number(p.mrp) || 0;
    const price = Number(p.price) || 0;
    const img = p.images?.[0];
    if (!img || mrp <= 0 || price <= 0 || price >= mrp) continue;
    const off = mrp - price;
    const pct = (off / mrp) * 100;
    scored.push({ pct, off, img });
  }
  if (scored.length === 0) return null;
  scored.sort((a, b) => b.pct - a.pct || b.off - a.off);
  return scored[0].img;
}

/** Simple finite carousel hook for side promos. */
function useFiniteCarousel(length, intervalMs) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!length || length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [length, intervalMs]);

  useEffect(() => {
    setIndex(0);
  }, [length]);

  return [index, setIndex];
}

/** Infinite carousel hook for main hero. */
function useInfiniteCarousel(length, intervalMs) {
  const [index, setIndex] = useState(0); // 0..length-1
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    if (!length || length <= 1) return;
    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [length, intervalMs]);

  useEffect(() => {
    setIndex(0);
  }, [length]);

  const handleTransitionEnd = () => {
    // reserved for further smooth-loop tweaks
  };

  const goTo = (nextIndex) => {
    if (!length) return;
    setAnimating(false);
    setIndex(((nextIndex % length) + length) % length);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimating(true));
    });
  };

  return [index, goTo, handleTransitionEnd, animating];
}

/** Futuristic 3D overlay gradients - dark and light variants */
const PROMO_BG_OVERLAY = {
  light: {
    light: "bg-gradient-to-t from-cyan-200/90 via-cyan-100/60 to-white/40 mix-blend-screen",
    dark: "bg-gradient-to-t from-cyan-950/90 via-cyan-900/60 to-cyan-800/40 mix-blend-screen",
  },
  medium: {
    light: "bg-gradient-to-t from-violet-200/90 via-violet-100/60 to-white/40 mix-blend-screen",
    dark: "bg-gradient-to-t from-violet-950/95 via-violet-900/70 to-violet-800/50 mix-blend-screen",
  },
  dark: {
    light: "bg-gradient-to-br from-indigo-200/90 via-indigo-100/60 to-white/40 mix-blend-screen",
    dark: "bg-gradient-to-br from-indigo-950/98 via-purple-900/80 to-cyan-900/60 mix-blend-screen",
  },
};

const Hero = () => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₦";
  const products = useSelector((state) => state.product.list);

  const topRatedImage = useMemo(
    () => getTopRatedPrimaryImage(products),
    [products]
  );
  const topDiscountImage = useMemo(
    () => getTopDiscountPrimaryImage(products),
    [products]
  );

  // Fake store data – later you can fetch from /api/stores or Redux
  const verifiedStores = useMemo(
    () => [
      {
        id: 1,
        name: "Lagos Tech Hub",
        rating: 4.9,
        orders: "2.1k+",
        tag: "Enterprise store",
        href: "/store/lagos-tech-hub",
      },
      {
        id: 2,
        name: "Abuja Gadgets Pro",
        rating: 4.8,
        orders: "1.6k+",
        tag: "Verified SME",
        href: "/store/abuja-gadgets-pro",
      },
      {
        id: 3,
        name: "Malta Electronics Lab",
        rating: 4.7,
        orders: "980+",
        tag: "EU warehouse",
        href: "/store/malta-electronics-lab",
      },
      {
        id: 4,
        name: "Krasnodar Digital Store",
        rating: 4.9,
        orders: "1.3k+",
        tag: "Priority store",
        href: "/store/krasnodar-digital-store",
      },
    ],
    []
  );

  const defaults = useMemo(
    () => ({
      featured: [
        {
          image: assets.hero_model_img,
          badgeLabel: "NEWS",
          badgeText: `20% Shipping Discount on Orders Above ${currency}1,000,000.00!`,
          title: "Gadgets you'll love. Prices you'll trust.",
          line1: "Perfect for small and medium-sized businesses.",
          line2:
            "Order from the comfort of your home/office anywhere nation wide.",
          priceLabel: "Starts from",
          price: `${currency}40,000`,
          cta: "Shop Now",
          href: "/shop",
        },
      ],
      promo1: [
        {
          image: topRatedImage || assets.hero_product_img1,
          title: "Best rated items",
          subtitle: "Top quality picks",
          href: "/shop?sort=rating",
          variant: "light",
        },
      ],
      promo2: [
        {
          image: topDiscountImage || assets.hero_product_img2,
          title: "Biggest discounts",
          subtitle: "Save more today",
          href: "/shop?sort=discount",
          variant: "medium",
        },
      ],
      microPromos: [
        {
          label: "Wholesales",
          desc: "SME–friendly bulk pricing",
          href: "/bulk",
        },
        {
          label: "Vendor center",
          desc: "Sell on Shpinx",
          href: "/vendors",
        },
      ],
      quickFilters: [
        { label: "New arrivals", href: "/shop?tag=new" },
        { label: "Top sellers", href: "/shop?tag=top" },
        { label: "Electronics", href: "/shop?category=electronics" },
        { label: "Computers", href: "/shop?category=computers" },
        { label: "Smartphones", href: "/shop?category=smartphones" },
      ],
      middleBanners: [
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
      ],
    }),
    [currency, topRatedImage, topDiscountImage]
  );

  const [remote, setRemote] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/home/content");
        const j = await res.json();
        if (!cancelled) setRemote(j);
      } catch {
        if (!cancelled)
          setRemote({ featured: [], promo1: [], promo2: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredBase =
    remote === undefined
      ? defaults.featured
      : remote.featured?.length
      ? remote.featured.map((s) => ({
          ...s,
          image: isValidImageSrc(s.image)
            ? s.image
            : defaults.featured[0].image,
        }))
      : defaults.featured;

  const promo1Slides =
    remote === undefined
      ? defaults.promo1
      : remote.promo1?.length
      ? remote.promo1.map((s) => ({
          ...s,
          image: isValidImageSrc(s.image)
            ? s.image
            : defaults.promo1[0].image,
        }))
      : defaults.promo1;

  const promo2Slides =
    remote === undefined
      ? defaults.promo2
      : remote.promo2?.length
      ? remote.promo2.map((s) => ({
          ...s,
          image: isValidImageSrc(s.image)
            ? s.image
            : defaults.promo2[0].image,
        }))
      : defaults.promo2;

  const featuredSlides = featuredBase;

  const [fi, setFi, handleTransitionEnd, animating] =
    useInfiniteCarousel(featuredSlides.length, 6500);
  const [p1i, setP1i] = useFiniteCarousel(promo1Slides.length, 5500);
  const [p2i, setP2i] = useFiniteCarousel(promo2Slides.length, 5500);

  return (
    <section className="mx-3 sm:mx-4 md:mx-6 relative">
      {/* Futuristic background glow - dark and light variants */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 dark:bg-cyan-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 dark:bg-violet-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Top info / quick filters bar */}
      <div className="mx-auto flex max-w-7xl flex-col gap-3 pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-cyan-100">
          <span className="rounded-full bg-slate-900 dark:bg-cyan-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white dark:text-cyan-300 border border-slate-700 dark:border-cyan-500/30 shadow-lg shadow-slate-900/20 dark:shadow-cyan-500/20">
            Shpinx Marketplace
          </span>
          <span className="text-[11px] sm:text-xs text-slate-600 dark:text-cyan-200/80">
            SME focused electronics hub • Nationwide delivery
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-cyan-200/70">
          {defaults.quickFilters.map((q) => (
            <Link
              key={q.label}
              href={q.href}
              className="rounded-full border border-slate-200 dark:border-cyan-500/30 px-2.5 py-1 transition hover:border-slate-900 dark:hover:border-cyan-400 hover:bg-slate-900 dark:hover:bg-cyan-900/50 hover:text-white dark:hover:text-cyan-300 hover:shadow-lg dark:hover:shadow-cyan-500/20"
            >
              {q.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main hero grid */}
      <div className="mx-auto mt-4 flex max-w-7xl gap-4 lg:gap-6 xl:gap-8 max-xl:flex-col">
        {/* Hero left (infinite main slider) */}
        <div className="group relative flex flex-1 flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-2xl shadow-slate-900/10 dark:shadow-cyan-500/10 border border-slate-300 dark:border-cyan-500/20 hover:border-slate-400 dark:hover:border-cyan-400/40 transition-all duration-300">
          {/* 3D depth effect - dark and light variants */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 dark:from-cyan-500/10 dark:via-transparent dark:to-violet-500/10" />
          
          <div
            className={`flex h-full transition-transform duration-500 ease-out ${
              animating ? "" : "transition-none"
            }`}
            style={{
              transform: `translateX(-${fi * 100}%)`,
              width: `${featuredSlides.length * 100}%`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {featuredSlides.map((slide, idx) => (
              <article
                key={idx}
                className="relative min-h-[320px] w-full min-w-full shrink-0 sm:min-h-[360px] lg:min-h-[420px]"
              >
                <Image
                  src={slide.image}
                  alt={slide.title || "Featured promo"}
                  fill
                  className="object-cover object-center opacity-90"
                  sizes="(max-width: 1280px) 100vw, min(896px, 100vw)"
                  priority={idx === 0}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-800/70 to-slate-900/50 dark:from-cyan-950/95 dark:via-cyan-900/70 dark:to-violet-900/50"
                  aria-hidden
                />
                {/* 3D glow overlay - dark and light variants */}
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 via-transparent to-violet-500/5 dark:from-cyan-500/10 dark:via-transparent dark:to-violet-500/10" aria-hidden />
                
                <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 lg:p-10">
                  {/* Top badge row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {(slide.badgeText || slide.badgeLabel) && (
                      <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-600/40 dark:border-cyan-400/40 bg-slate-800/60 dark:bg-cyan-950/60 px-3 py-1 text-[11px] text-slate-200 dark:text-cyan-200 backdrop-blur-md shadow-lg shadow-slate-900/20 dark:shadow-cyan-500/20">
                        {slide.badgeLabel && (
                          <span className="rounded-full bg-slate-700 dark:bg-cyan-500/80 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white dark:text-white shadow-lg shadow-slate-900/30 dark:shadow-cyan-400/40">
                            {slide.badgeLabel}
                          </span>
                        )}
                        <span className="line-clamp-1">{slide.badgeText}</span>
                        <ChevronRightIcon
                          className="hidden shrink-0 text-slate-400 dark:text-cyan-300/80 transition-all group-hover:translate-x-0.5 sm:block"
                          size={14}
                        />
                      </div>
                    )}
                  </div>

                  {/* Main content */}
                  <div className="mt-6 max-w-xl">
                    {slide.title && (
                      <h1 className="text-balance text-2xl font-semibold leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:text-3xl md:text-4xl lg:text-[2.5rem] bg-gradient-to-r from-white via-slate-100 to-slate-200 dark:from-white dark:via-cyan-100 dark:to-violet-100 bg-clip-text">
                        {slide.title}
                      </h1>
                    )}
                    {(slide.line1 || slide.line2) && (
                      <div className="mt-3 space-y-1 text-xs font-medium text-slate-300 dark:text-cyan-100/90 drop-shadow sm:mt-4 sm:text-sm">
                        {slide.line1 && <p>{slide.line1}</p>}
                        {slide.line2 && <p>{slide.line2}</p>}
                      </div>
                    )}
                    {(slide.price || slide.priceLabel) && (
                      <div className="mt-4 flex flex-wrap items-baseline gap-2 text-xs text-slate-300 dark:text-cyan-100/95 drop-shadow sm:mt-6 sm:text-sm">
                        {slide.priceLabel && <p>{slide.priceLabel}</p>}
                        {slide.price && (
                          <p className="text-2xl font-semibold text-slate-200 dark:text-cyan-300 sm:text-3xl shadow-lg shadow-slate-900/30 dark:shadow-cyan-400/30">
                            {slide.price}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-8">
                      {slide.cta && slide.href && (
                        <Link
                          href={slide.href}
                          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-slate-700 to-slate-800 dark:from-cyan-500 dark:to-violet-500 px-6 py-2 text-xs font-semibold text-white shadow-xl shadow-slate-900/40 dark:shadow-cyan-500/40 transition hover:scale-[1.02] hover:shadow-slate-900/60 dark:hover:shadow-cyan-500/60 active:scale-95 sm:px-8 sm:py-3 sm:text-sm border border-slate-600 dark:border-cyan-400/30"
                        >
                          {slide.cta}
                          <ArrowRightIcon
                            size={18}
                            className="ml-1.5"
                          />
                        </Link>
                      )}
                      <Link
                        href="/shop?tag=offers"
                        className="inline-flex items-center text-[11px] font-medium text-slate-400 dark:text-cyan-200/80 underline-offset-2 hover:underline hover:text-slate-300 dark:hover:text-cyan-300 sm:text-xs"
                      >
                        View all offers
                        <ChevronRightIcon size={14} className="ml-1" />
                      </Link>
                    </div>
                  </div>

                  {/* Bottom indicator row */}
                  {featuredSlides.length > 1 && (
                    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-cyan-200/70">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-300 dark:text-cyan-300">{fi + 1}</span>
                        <span className="text-slate-600 dark:text-cyan-200/50">
                          / {featuredSlides.length}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {featuredSlides.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            aria-label={`Go to slide ${i + 1}`}
                            onClick={() => setFi(i)}
                            className={`h-1.5 rounded-full transition-all shadow-lg ${
                              i === fi ? "w-5 bg-gradient-to-r from-slate-600 to-slate-700 dark:from-cyan-400 dark:to-violet-400 shadow-slate-900/50 dark:shadow-cyan-400/50" : "w-2 bg-slate-600/30 dark:bg-cyan-400/30 hover:bg-slate-600/50 dark:hover:bg-cyan-400/50"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {featuredSlides.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() =>
                  setFi(
                    fi - 1 < 0
                      ? featuredSlides.length - 1
                      : fi - 1
                  )
                }
                className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-gradient-to-br from-slate-700/90 to-slate-800/90 dark:from-cyan-500/90 dark:to-violet-500/90 p-2 text-white shadow-xl shadow-slate-900/40 dark:shadow-cyan-500/40 hover:from-slate-600 hover:to-slate-700 dark:hover:from-cyan-400 dark:hover:to-violet-400 lg:flex border border-slate-600/30 dark:border-cyan-400/30"
              >
                <ChevronLeftIcon size={18} />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() =>
                  setFi((fi + 1) % featuredSlides.length)
                }
                className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-gradient-to-br from-slate-700/90 to-slate-800/90 dark:from-cyan-500/90 dark:to-violet-500/90 p-2 text-white shadow-xl shadow-slate-900/40 dark:shadow-cyan-500/40 hover:from-slate-600 hover:to-slate-700 dark:hover:from-cyan-400 dark:hover:to-violet-400 lg:flex border border-slate-600/30 dark:border-cyan-400/30"
              >
                <ChevronRightIcon size={18} />
              </button>
            </>
          )}
        </div>

        {/* Right side – stacked promos */}
        <div className="flex w-full flex-col gap-4 text-sm md:flex-row xl:max-w-sm xl:flex-col">
          <PromoCarousel
            slides={promo1Slides}
            index={p1i}
            setIndex={setP1i}
          />
          <PromoCarousel
            slides={promo2Slides}
            index={p2i}
            setIndex={setP2i}
          />
        </div>
      </div>

      {/* Verified stores section */}
      <VerifiedStoresSection stores={verifiedStores} currency={currency} />

      {/* Micro promos row under the hero */}
      <div className="mx-auto mt-4 grid max-w-7xl grid-cols-2 gap-2 text-[11px] sm:grid-cols-4 sm:text-xs">
        {defaults.microPromos.map((p) => (
          <Link
            key={p.label}
            href={p.href}
            className="group flex items-center justify-between gap-2 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-cyan-900/40 dark:to-violet-900/40 px-3 py-2 text-slate-800 dark:text-cyan-100 shadow-lg shadow-slate-200/50 dark:shadow-cyan-500/10 transition hover:bg-slate-50 dark:hover:from-cyan-800/50 dark:hover:to-violet-800/50 hover:text-slate-900 dark:hover:text-cyan-200 hover:shadow-xl dark:hover:shadow-cyan-500/20 hover:-translate-y-0.5 border border-slate-200 dark:border-cyan-500/20 dark:hover:border-cyan-400/40"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800 dark:text-cyan-200">{p.label}</span>
              <span className="text-[10px] text-slate-500 dark:text-cyan-200/60 group-hover:text-slate-600 dark:group-hover:text-cyan-200/80">
                {p.desc}
              </span>
            </div>
            <ArrowRightIcon
              size={16}
              className="shrink-0 text-slate-400 dark:text-cyan-300/60 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600 dark:group-hover:text-cyan-200"
            />
          </Link>
        ))}
      </div>

      {/* Categories strip */}
      <div className="mt-5">
        <CategoriesMarquee />
      </div>
    </section>
  );
};

function PromoCarousel({ slides, index, setIndex }) {
  if (!slides || slides.length === 0) return null;

  const length = slides.length;
  const hasMany = length > 1;

  const handleNext = () => {
    if (!hasMany) return;
    setIndex((index + 1) % length);
  };

  const handlePrev = () => {
    if (!hasMany) return;
    setIndex((index - 1 + length) % length);
  };

  const currentSlide = slides[index];

  return (
    <aside className="relative flex w-full flex-1 min-h-[180px] overflow-hidden rounded-3xl bg-slate-200 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-cyan-500/10 border border-slate-300 dark:border-cyan-500/20 hover:border-slate-400 dark:hover:border-cyan-400/40 transition-all duration-300">
      {/* 3D depth effect - dark and light variants */}
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 via-transparent to-violet-500/5 dark:from-cyan-500/10 dark:via-transparent dark:to-violet-500/10" />
      
      <Link
        href={currentSlide.href || "/shop"}
        className="group relative block min-h-[180px] w-full"
      >
        {isValidImageSrc(currentSlide.image) ? (
          <Image
            src={currentSlide.image}
            alt={currentSlide.title || "Promo"}
            fill
            className="object-cover object-center opacity-85"
            sizes="(max-width: 1280px) 100vw, 380px"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-slate-400 dark:bg-gradient-to-br dark:from-slate-700 dark:to-slate-800"
            aria-hidden
          />
        )}
        <div
          className={`absolute inset-0 ${
            PROMO_BG_OVERLAY[currentSlide.variant]?.dark ||
            PROMO_BG_OVERLAY.dark.light
          }`}
          aria-hidden
        />
        {/* 3D glow - dark and light variants */}
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 via-transparent to-violet-500/5 dark:from-cyan-500/10 dark:via-transparent dark:to-violet-500/10" aria-hidden />
        
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-5">
          <div className="flex flex-col gap-1">
            <p className="max-w-[14rem] text-base font-semibold leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:text-lg bg-gradient-to-r from-white via-slate-100 to-slate-200 dark:from-white dark:via-cyan-100 dark:to-violet-100 bg-clip-text">
              {currentSlide.title || "Offers"}
            </p>
            <p className="text-[11px] text-slate-300 dark:text-cyan-100/85 sm:text-xs">
              {currentSlide.subtitle ||
                "View more electronics deals today"}
            </p>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-slate-300 dark:text-cyan-200/95 drop-shadow sm:text-xs">
            View more
            <ArrowRightIcon
              className="shrink-0 transition-transform group-hover:translate-x-0.5"
              size={16}
            />
          </p>
        </div>
      </Link>
      {hasMany && (
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1">
          <button
            type="button"
            aria-label="Previous promo"
            onClick={(e) => {
              e.preventDefault();
              handlePrev();
            }}
            className="pointer-events-auto rounded-full bg-gradient-to-br from-slate-600/80 to-slate-700/80 dark:from-cyan-600/80 dark:to-violet-600/80 p-1 text-white shadow-lg shadow-slate-900/30 dark:shadow-cyan-500/30 hover:from-slate-500 hover:to-slate-600 dark:hover:from-cyan-500 dark:hover:to-violet-500 border border-slate-500/30 dark:border-cyan-400/30"
          >
            <ChevronLeftIcon size={16} />
          </button>
          <button
            type="button"
            aria-label="Next promo"
            onClick={(e) => {
              e.preventDefault();
              handleNext();
            }}
            className="pointer-events-auto rounded-full bg-gradient-to-br from-slate-600/80 to-slate-700/80 dark:from-cyan-600/80 dark:to-violet-600/80 p-1 text-white shadow-lg shadow-slate-900/30 dark:shadow-cyan-500/30 hover:from-slate-500 hover:to-slate-600 dark:hover:from-cyan-500 dark:hover:to-violet-500 border border-slate-500/30 dark:border-cyan-400/30"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}

/** Verified stores strip */
function VerifiedStoresSection({ stores, currency }) {
  if (!stores || stores.length === 0) return null;

  return (
    <div className="mx-auto mt-6 max-w-7xl rounded-3xl bg-slate-50 dark:bg-gradient-to-br dark:from-cyan-900/20 dark:via-slate-900/40 dark:to-violet-900/20 px-3 py-3 text-[11px] shadow-xl shadow-slate-200/50 dark:shadow-cyan-500/10 ring-1 ring-slate-200 dark:ring-cyan-500/20 dark:hover:ring-cyan-400/20 sm:px-4 sm:py-4 sm:text-xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 dark:from-cyan-600 dark:to-violet-600 text-white shadow-lg shadow-slate-900/40 dark:shadow-cyan-500/40">
            <ShieldCheckIcon size={16} />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-cyan-100">
              Verified stores
            </p>
            <p className="text-[10px] text-slate-500 dark:text-cyan-200/60">
              Curated stores with strict quality, logistics and payment checks
            </p>
          </div>
        </div>
        <Link
          href="/vendors/verified"
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-cyan-500/30 px-3 py-1 text-[10px] font-semibold text-slate-800 dark:text-cyan-200 transition hover:border-slate-900 dark:hover:border-cyan-400 hover:bg-slate-900 dark:hover:bg-cyan-900/40 hover:text-white dark:hover:text-cyan-100 hover:shadow-lg dark:hover:shadow-cyan-500/20"
        >
          Join as a verified store
          <ArrowRightIcon size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stores.map((v) => (
          <Link
            key={v.id}
            href={v.href}
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-gradient-to-br dark:from-cyan-900/30 dark:to-violet-900/20 p-3 text-slate-800 dark:text-cyan-100 shadow-lg shadow-slate-200/50 dark:shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:shadow-xl dark:hover:shadow-cyan-500/20 ring-1 ring-slate-100 dark:ring-cyan-500/20 hover:ring-slate-900 dark:hover:ring-cyan-400/40"
          >
            <div className="flex items-center justify-between gap-1">
              <p className="line-clamp-1 text-[11px] font-semibold sm:text-xs text-slate-800 dark:text-cyan-200">
                {v.name}
              </p>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                <ShieldCheckIcon size={11} />
                Verified
              </span>
            </div>
            <p className="mt-1 line-clamp-1 text-[10px] text-slate-500 dark:text-cyan-200/60">
              {v.tag}
            </p>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600 dark:text-cyan-200/70">
              <span className="inline-flex items-center gap-0.5">
                <StarIcon
                  size={12}
                  className="text-amber-400"
                  aria-hidden
                />
                <span>{v.rating.toFixed(1)}</span>
              </span>
              <span>{v.orders} orders</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Hero;
