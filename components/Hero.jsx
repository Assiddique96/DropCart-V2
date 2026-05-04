"use client";
import { assets } from "@/assets/assets";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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

function useCarouselIndex(length, intervalMs) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (length <= 1) return undefined;
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

const Hero = () => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";
  const products = useSelector((state) => state.product.list);
  const topRatedImage = useMemo(
    () => getTopRatedPrimaryImage(products),
    [products]
  );
  const topDiscountImage = useMemo(
    () => getTopDiscountPrimaryImage(products),
    [products]
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
          cta: "Shop Now!",
          href: "/shop",
        },
      ],
      promo1: [
        {
          image: topRatedImage || assets.hero_product_img1,
          title: "Best products",
          subtitle: "View more",
          href: "/shop",
          variant: "light",
        },
      ],
      promo2: [
        {
          image: topDiscountImage || assets.hero_product_img2,
          title: "Top discounts",
          subtitle: "View more",
          href: "/shop",
          variant: "medium",
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

  const featuredSlides =
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

  const [fi, setFi] = useCarouselIndex(
    featuredSlides.length,
    6500
  );
  const [p1i, setP1i] = useCarouselIndex(promo1Slides.length, 5500);
  const [p2i, setP2i] = useCarouselIndex(promo2Slides.length, 5500);

  const go = (setter, len, delta) => {
    setter((i) => (i + delta + len) % len);
  };

  return (
    <div className="mx-6">
      <div className="mx-auto my10 flex max-w-7xl gap-8 max-xl:flex-col">
        {/* Hero left */}
        <div className="group relative flex flex-1 flex-col overflow-hidden rounded-3xl bg-gray-300 dark:bg-slate-900">
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${fi * 100}%)` }}
          >
            {featuredSlides.map((slide, idx) => (
              <div
                key={idx}
                className="relative min-h-[300px] w-full min-w-full shrink-0 sm:min-h-[360px] xl:min-h-[420px]"
              >
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1280px) 100vw, min(896px, 100vw)"
                  priority={idx === 0}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/25"
                  aria-hidden
                />
                <div className="absolute inset-0 z-10 flex max-w-2xl flex-col justify-center p-5 sm:p-16">
                  {(slide.badgeText || slide.badgeLabel) && (
                    <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-black/40 pr-4 pl-1 py-1 text-xs text-gray-200 backdrop-blur-sm sm:text-sm">
                      {slide.badgeLabel && (
                        <span className="max-sm:ml-0 rounded-full bg-white/25 px-3 py-1 text-xs text-white">
                          {slide.badgeLabel}
                        </span>
                      )}
                      {slide.badgeText}
                      <ChevronRightIcon
                        className="shrink-0 text-white/80 transition-all group-hover:ml-2"
                        size={16}
                      />
                    </div>
                  )}
                  {slide.title && (
                    <h2 className="my-3 max-w-md text-3xl font-medium leading-[1.2] text-white drop-shadow-md sm:text-5xl">
                      {slide.title}
                    </h2>
                  )}
                  {(slide.line1 || slide.line2) && (
                    <div className="mt-4 text-sm font-medium text-white/90 drop-shadow sm:mt-8">
                      {slide.line1 && <p>{slide.line1}</p>}
                      {slide.line2 && <p>{slide.line2}</p>}
                    </div>
                  )}
                  {(slide.price || slide.priceLabel) && (
                    <div className="mt-4 text-sm font-medium text-white/95 drop-shadow sm:mt-8">
                      {slide.priceLabel && <p>{slide.priceLabel}</p>}
                      {slide.price && (
                        <p className="text-3xl font-semibold text-white">
                          {slide.price}
                        </p>
                      )}
                    </div>
                  )}
                  {slide.cta && slide.href && (
                    <Link
                      href={slide.href}
                      className="mt-4 inline-block w-fit rounded-md bg-white px-7 py-2.5 text-center text-sm font-medium text-slate-900 shadow-lg transition hover:bg-white/95 hover:scale-[1.02] active:scale-95 sm:mt-10 sm:px-10 sm:py-4"
                    >
                      {slide.cta}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          {featuredSlides.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() => go(setFi, featuredSlides.length, -1)}
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow hover:bg-white dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                <ChevronLeftIcon size={20} />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => go(setFi, featuredSlides.length, 1)}
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow hover:bg-white dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                <ChevronRightIcon size={20} />
              </button>
              <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
                {featuredSlides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => setFi(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === fi
                        ? "w-6 bg-white"
                        : "w-2 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right promos */}
        <div className="flex w-full flex-col gap-5 text-sm md:flex-row xl:max-w-sm xl:flex-col">
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
      <CategoriesMarquee />
    </div>
  );
};

/** Darkening overlay on promo background — variant presets from admin. */
const PROMO_BG_OVERLAY = {
  light:
    "bg-gradient-to-t from-black/70 via-black/40 to-black/25",
  medium:
    "bg-gradient-to-t from-black/75 via-black/50 to-black/30",
  dark:
    "bg-gradient-to-t from-black/85 via-black/65 to-black/40",
};

function PromoCarousel({ slides, index, setIndex }) {
  return (
    <div className="relative flex-1 w-full min-h-[200px] rounded-3xl overflow-hidden shadow-md bg-slate-200 dark:bg-slate-900">
      <div
        className="flex h-full min-h-[200px] transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, idx) => (
          <Link
            key={idx}
            href={slide.href || "/shop"}
            className="group relative block min-h-[200px] min-w-full shrink-0"
          >
            {isValidImageSrc(slide.image) ? (
              <Image
                src={slide.image}
                alt=""
                fill
                className="object-cover object-center"
                sizes="(max-width: 1280px) 100vw, 380px"
              />
            ) : (
              <div
                className="absolute inset-0 bg-slate-400 dark:bg-slate-700"
                aria-hidden
              />
            )}
            <div
              className={`absolute inset-0 ${
                PROMO_BG_OVERLAY[slide.variant] ||
                PROMO_BG_OVERLAY.light
              }`}
              aria-hidden
            />
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 px-8">
              <p className="max-w-[14rem] text-2xl font-semibold leading-tight text-white drop-shadow-md sm:text-3xl">
                {slide.title || "Offers"}
              </p>
              <p className="mt-3 flex items-center gap-1 text-sm font-medium text-white/95 drop-shadow">
                {slide.subtitle || "View more"}
                <ArrowRightIcon
                  className="shrink-0 transition-transform group-hover:translate-x-0.5"
                  size={18}
                />
              </p>
            </div>
          </Link>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Promo slide ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                setIndex(i);
              }}
              className={`h-1.5 rounded-full ${
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/45"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Hero;
