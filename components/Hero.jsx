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
import { useRouter } from "next/navigation";
import CategoriesMarquee from "./CategoriesMarquee";

/** Utils */

function isValidImageSrc(src) {
  if (src == null) return false;
  if (typeof src === "object") return true;
  if (typeof src === "string") return src.trim() !== "";
  return false;
}

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

/** Carousels */

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

function useInfiniteCarousel(length, intervalMs) {
  const [index, setIndex] = useState(0);
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

  const handleTransitionEnd = () => {};

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

/** Static overlay config (kept for future theming) */

const PROMO_BG_OVERLAY = {
  light: { light: "", dark: "" },
  medium: { light: "", dark: "" },
  dark: { light: "", dark: "" },
};

const Hero = () => {
  const router = useRouter();

  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₦";
  const products = useSelector((state) => state?.product?.list ?? []);

  const user = useSelector((state) => state?.auth?.user ?? null);
  const store = useSelector((state) => state?.store?.currentStore ?? null);
  const isVerifiedStore = store?.isVerified ?? false;
  const hasStore = !!store;

  const topRatedImage = useMemo(
    () => getTopRatedPrimaryImage(products),
    [products]
  );
  const topDiscountImage = useMemo(
    () => getTopDiscountPrimaryImage(products),
    [products]
  );

  /** DEFAULT STATIC FALLBACKS */

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
          key: "wholesale",
          label: "Wholesales",
          desc: "SME–friendly bulk pricing",
          href: "/bulk",
        },
        {
          key: "vendor-center",
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

  /** REMOTE HOME CONTENT */

  const [remote, setRemote] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/home/content");
        const j = await res.json();
        if (!cancelled) setRemote(j);
      } catch {
        if (!cancelled) setRemote({ featured: [], promo1: [], promo2: [] });
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

  /** VERIFIED STORES + WHOLESALE + VENDOR CENTER – FETCH FROM SHPINX PAGES */

  const [verifiedStores, setVerifiedStores] = useState([]);
  const [wholesalePromo, setWholesalePromo] = useState(null);
  const [vendorCenterPromo, setVendorCenterPromo] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadHeroMeta = async () => {
      try {
        const [verifiedStoresRes, wholesaleRes, vendorRes] =
          await Promise.all([
            fetch("/api/verified-stores"),
            fetch("/api/wholesale"),
            fetch("/api/vendor-center"),
          ]);

        const [verifiedStoresData, wholesaleData, vendorData] =
          await Promise.all([
            verifiedStoresRes.json(),
            wholesaleRes.json(),
            vendorRes.json(),
          ]);

        if (cancelled) return;

        setVerifiedStores(verifiedStoresData?.stores || []);
        setWholesalePromo(wholesaleData?.heroPromo || null);
        setVendorCenterPromo(vendorData?.heroPromo || null);
      } catch (e) {
        if (cancelled) return;
        setVerifiedStores([]);
        setWholesalePromo(null);
        setVendorCenterPromo(null);
      }
    };

    loadHeroMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  const microPromos = useMemo(() => {
    const base = defaults.microPromos;

    return base.map((p) => {
      if (p.key === "wholesale" && wholesalePromo) {
        return {
          ...p,
          label: wholesalePromo.label ?? p.label,
          desc: wholesalePromo.desc ?? p.desc,
          href: wholesalePromo.href ?? p.href,
        };
      }
      if (p.key === "vendor-center" && vendorCenterPromo) {
        return {
          ...p,
          label: vendorCenterPromo.label ?? p.label,
          desc: vendorCenterPromo.desc ?? p.desc,
          href: vendorCenterPromo.href ?? p.href,
        };
      }
      return p;
    });
  }, [defaults, wholesalePromo, vendorCenterPromo]);

  /** JOIN AS VERIFIED STORE – ROUTING LOGIC */

  const handleJoinVerifiedStore = () => {
    if (!user) {
      router.push("/auth/signup");
      return;
    }

    if (hasStore) {
      if (isVerifiedStore) {
        router.push("/vendors/verified/dashboard");
      } else {
        router.push("/vendors/verify-store");
      }
      return;
    }

    router.push("/vendors");
  };

  return (
    <section className="mx-3 sm:mx-4 md:mx-6">
      {/* Top info / quick filters bar */}
      <div className="mx-auto flex max-w-7xl flex-col gap-3 pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200">
          <span className="rounded-full bg-slate-900 dark:bg-slate-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white dark:text-slate-200 border border-slate-700 dark:border-slate-600">
            Shpinx Marketplace
          </span>
          <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
            SME focused electronics hub • Nationwide delivery
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          {defaults.quickFilters.map((q) => (
            <Link
              key={q.label}
              href={q.href}
              className="rounded-full border border-slate-200 dark:border-slate-600 px-2.5 py-1 transition hover:border-slate-900 dark:hover:border-slate-400 hover:bg-slate-900 dark:hover:bg-slate-700 hover:text-white dark:hover:text-slate-100"
            >
              {q.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main hero grid */}
      <div className="mx-auto mt-4 flex max-w-7xl gap-4 lg:gap-6 xl:gap-8 max-xl:flex-col">
        {/* Hero left (infinite main slider) */}
        <div className="group relative flex flex-1 flex-col overflow-hidden rounded-3xl bg-transparent border-0 transition-all duration-300">
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
                className="relative min-h-[320px] w-full min-w-full shrink-0 sm:min-h-[360px] lg:min-h-[420px] bg-black"
              >
                {isValidImageSrc(slide.image) && (
                  <Image
                    src={slide.image}
                    alt={slide.title || "Featured promo"}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1280px) 100vw, min(896px, 100vw)"
                    priority={idx === 0}
                  />
                )}

                {/* light, non‑gray overlay for text readability */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent"
                  aria-hidden
                />

                <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 lg:p-10">
                  {/* Top badge row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {(slide.badgeText || slide.badgeLabel) && (
                      <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-600/60 bg-black/60 px-3 py-1 text-[11px] text-slate-100 backdrop-blur-md">
                        {slide.badgeLabel && (
                          <span className="rounded-full bg-white/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            {slide.badgeLabel}
                          </span>
                        )}
                        <span className="line-clamp-1">{slide.badgeText}</span>
                        <ChevronRightIcon
                          className="hidden shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 sm:block"
                          size={14}
                        />
                      </div>
                    )}
                  </div>

                  {/* Main content */}
                  <div className="mt-6 max-w-xl">
                    {slide.title && (
                      <h1 className="text-balance text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-4xl lg:text-[2.5rem]">
                        {slide.title}
                      </h1>
                    )}
                    {(slide.line1 || slide.line2) && (
                      <div className="mt-3 space-y-1 text-xs font-medium text-slate-100 sm:mt-4 sm:text-sm">
                        {slide.line1 && <p>{slide.line1}</p>}
                        {slide.line2 && <p>{slide.line2}</p>}
                      </div>
                    )}
                    {(slide.price || slide.priceLabel) && (
                      <div className="mt-4 flex flex-wrap items-baseline gap-2 text-xs text-slate-100 sm:mt-6 sm:text-sm">
                        {slide.priceLabel && <p>{slide.priceLabel}</p>}
                        {slide.price && (
                          <p className="text-2xl font-semibold text-white sm:text-3xl">
                            {slide.price}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-8">
                      {slide.cta && slide.href && (
                        <Link
                          href={slide.href}
                          className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-2 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95 sm:px-8 sm:py-3 sm:text-sm border border-white/20"
                        >
                          {slide.cta}
                          <ArrowRightIcon size={18} className="ml-1.5" />
                        </Link>
                      )}
                      <Link
                        href="/shop?tag=offers"
                        className="inline-flex items-center text-[11px] font-medium text-slate-100 underline-offset-2 hover:underline sm:text-xs"
                      >
                        View all offers
                        <ChevronRightIcon size={14} className="ml-1" />
                      </Link>
                    </div>
                  </div>

                  {/* Bottom indicator row */}
                  {featuredSlides.length > 1 && (
                    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-200">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-100">{fi + 1}</span>
                        <span className="text-slate-300">
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
                            className={`h-1.5 rounded-full transition-all ${
                              i === fi
                                ? "w-5 bg-white"
                                : "w-2 bg-white/50 hover:bg-white/80"
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
                  setFi(fi - 1 < 0 ? featuredSlides.length - 1 : fi - 1)
                }
                className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 lg:flex border border-white/20"
              >
                <ChevronLeftIcon size={18} />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => setFi((fi + 1) % featuredSlides.length)}
                className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 lg:flex border border-white/20"
              >
                <ChevronRightIcon size={18} />
              </button>
            </>
          )}
        </div>

        {/* Right side – stacked promos */}
        <div className="flex w-full flex-col gap-4 text-sm md:flex-row xl:max-w-sm xl:flex-col">
          <PromoCarousel slides={promo1Slides} index={p1i} setIndex={setP1i} />
          <PromoCarousel slides={promo2Slides} index={p2i} setIndex={setP2i} />
        </div>
      </div>

      {/* Verified stores section – data from /api/verified-stores */}
      <VerifiedStoresSection
        stores={
          verifiedStores.length
            ? verifiedStores
            : [
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
              ]
        }
        onJoinVerifiedStore={handleJoinVerifiedStore}
      />

      {/* Micro promos row under the hero – wholesale + vendor center powered from pages */}
      <div className="mx-auto mt-4 grid max-w-7xl grid-cols-2 gap-2 text-[11px] sm:grid-cols-4 sm:text-xs">
        {microPromos.map((p) => (
          <Link
            key={p.label}
            href={p.href}
            className="group flex items-center justify-between gap-2 rounded-2xl bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:-translate-y-0.5 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {p.label}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-200">
                {p.desc}
              </span>
            </div>
            <ArrowRightIcon
              size={16}
              className="shrink-0 text-slate-400 dark:text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-200"
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

/** PromoCarousel */

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
    <aside className="relative flex w-full flex-1 min-h-[180px] overflow-hidden rounded-3xl bg-transparent border-0 transition-all duration-300">
      <Link
        href={currentSlide.href || "/shop"}
        className="group relative block min-h-[180px] w-full"
      >
        {isValidImageSrc(currentSlide.image) && (
          <Image
            src={currentSlide.image}
            alt={currentSlide.title || "Promo"}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1280px) 100vw, 380px"
          />
        )}

        {/* lighter overlay so image is visible */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/10 to-transparent"
          aria-hidden
        />

        <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-5">
          <div className="flex flex-col gap-1">
            <p className="max-w-[14rem] text-base font-semibold leading-tight text-white sm:text-lg">
              {currentSlide.title || "Offers"}
            </p>
            <p className="text-[11px] text-slate-100 sm:text-xs">
              {currentSlide.subtitle || "View more electronics deals today"}
            </p>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-slate-100 sm:text-xs">
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
            className="pointer-events-auto rounded-full bg-black/60 p-1 text-white hover:bg-black/80 border border-white/20"
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
            className="pointer-events-auto rounded-full bg-black/60 p-1 text-white hover:bg-black/80 border border-white/20"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}

/** Verified stores */

function VerifiedStoresSection({ stores, onJoinVerifiedStore }) {
  if (!stores || stores.length === 0) return null;

  return (
    <div className="mx-auto mt-6 max-w-7xl rounded-3xl bg-white dark:bg-slate-900 px-3 py-3 text-[11px] ring-1 ring-slate-200 dark:ring-slate-700 sm:px-4 sm:py-4 sm:text-xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white">
            <ShieldCheckIcon size={16} />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Verified stores
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-300">
              Curated stores with strict quality, logistics and payment checks
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onJoinVerifiedStore}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-600 px-3 py-1 text-[10px] font-semibold text-slate-800 dark:text-slate-200 transition hover:border-slate-900 dark:hover:border-slate-400 hover:bg-slate-900 dark:hover:bg-slate-700 hover:text-white dark:hover:text-slate-100"
        >
          Join as a verified store
          <ArrowRightIcon size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stores.map((v) => {
          const ratingNumber = Number(v.rating);
          const ratingDisplay = Number.isFinite(ratingNumber)
            ? ratingNumber.toFixed(1)
            : v.rating ?? "-";

          return (
            <Link
              key={v.id}
              href={v.href}
              className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-800 p-3 text-slate-800 dark:text-slate-200 transition hover:-translate-y-0.5 ring-1 ring-slate-100 dark:ring-slate-700 hover:ring-slate-900 dark:hover:ring-slate-500"
            >
              <div className="flex items-center justify_between gap-1">
                <p className="line-clamp-1 text-[11px] font-semibold sm:text-xs text-slate-800 dark:text-slate-200">
                  {v.name}
                </p>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500">
                  <ShieldCheckIcon size={11} />
                  Verified
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-[10px] text-slate-500 dark:text-slate-300">
                {v.tag}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-0.5">
                  <StarIcon
                    size={12}
                    className="text-amber-400"
                    aria-hidden
                  />
                  <span>{ratingDisplay}</span>
                </span>
                <span>{v.orders} orders</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Hero;
