"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "lucide-react";
import { assets } from "@/assets/assets";

function isValidImageSrc(src) {
  if (src == null) return false;
  if (typeof src === "string") return src.trim() !== "";
  return true;
}

const MiddleBannerRow = ({ banners }) => {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = 3200;
    const t = setInterval(() => setActive((i) => (i + 1) % banners.length), interval);
    return () => clearInterval(t);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  const hero = banners.find((b) => b.size === "lg") || banners[0];

  return (
    <div ref={containerRef} className="mx-auto mt-6 w-full max-w-7xl px-3 sm:px-4">
      <div className="relative overflow-hidden rounded-[2.6rem] border border-cyan-400/15 bg-[#02040d] shadow-[0_0_120px_rgba(34,211,238,0.12)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.24),transparent_24%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.20),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.15),transparent_25%),linear-gradient(135deg,rgba(2,4,13,0.98),rgba(1,3,10,0.94))]" />
        <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px]" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[1100px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10 animate-[spinOrbit_28s_linear_infinite]" />
          <div className="absolute left-1/2 top-1/2 h-[860px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-300/10 animate-[spinOrbitReverse_22s_linear_infinite]" />
          <div className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 [transform:perspective(1400px)_rotateX(74deg)] animate-spin" />
          <div className="absolute inset-0 bg-[linear-gradient(transparent,rgba(255,255,255,0.035),transparent)] bg-[length:100%_7px] opacity-20 animate-[scanMove_5s_linear_infinite]" />
          <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        </div>

        <div className="relative min-h-[460px] p-4 sm:p-6 lg:p-8">
          <div className="relative grid min-h-[420px] place-items-center overflow-hidden rounded-[2.1rem] border border-white/10 bg-white/5 backdrop-blur-2xl">
            {isValidImageSrc(hero.image) && (
              <Image
                src={hero.image}
                alt={hero.title || "Flash deals"}
                fill
                className="object-cover object-center scale-110"
                sizes="100vw"
                priority
              />
            )}

            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(0,0,0,0.94)_8%,rgba(0,0,0,0.52)_45%,rgba(0,0,0,0.12)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,0.30),transparent_18%),radial-gradient(circle_at_70%_18%,rgba(168,85,247,0.22),transparent_20%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.14),transparent_26%)]" />
            <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] animate-[scanMove_4.8s_linear_infinite]" />

            <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/15 bg-cyan-300/5 blur-2xl animate-pulse" />
            <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-300/15 bg-fuchsia-300/5 blur-2xl animate-pulse" />

            <div className="relative z-10 flex h-full w-full flex-col justify-between p-6 sm:p-8 lg:p-10">
              <div className="max-w-2xl space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-cyan-100 backdrop-blur-md">
                  Infinity tunnel
                </span>
                <h2 className="text-3xl font-semibold leading-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
                  {hero.title || "Limited-time offers"}
                </h2>
                {hero.subtitle && (
                  <p className="max-w-xl text-sm leading-relaxed text-white/82 sm:text-base">
                    {hero.subtitle}
                  </p>
                )}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-medium text-white/88 backdrop-blur-md">
                  {hero.cta || "View deals"}
                  <ArrowRightIcon size={15} />
                </span>
                <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-2 text-xs font-medium text-fuchsia-100 backdrop-blur-md">
                  {mounted ? "Live motion" : "Loading"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const defaultMiddleBanners = [
  {
    id: 1,
    size: "lg",
    title: "Flash deals for SMEs",
    subtitle: "Limited-time bulk discounts on core gadgets",
    cta: "Browse flash deals",
    href: "/flash-deals",
    image: assets.hero_product_img1,
  },
  {
    id: 2,
    size: "sm",
    title: "International shipping",
    subtitle: "Malta & EU warehouse for cross-border orders",
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
