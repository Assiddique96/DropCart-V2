"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform, useMotionValue, useVelocity } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";
import { assets } from "@/assets/assets";

function isValidImageSrc(src) {
  if (src == null) return false;
  if (typeof src === "string") return src.trim() !== "";
  return true;
}

function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return pos;
}

const MiddleBannerRow = ({ banners }) => {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(0);
  const [hoveringId, setHoveringId] = useState(null);

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });

  const depth = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), {
    stiffness: 80,
    damping: 20,
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const velX = useVelocity(mouseX);
  const velY = useVelocity(mouseY);

  const parallaxX = useTransform(velX, [-300, 0, 300], [-12, 0, 12]);
  const parallaxY = useTransform(velY, [-300, 0, 300], [-8, 0, 8]);

  const { x: mx, y: my } = useMousePosition();

  useEffect(() => {
    if (!mounted) return;
    const interval = 3000;
    const t = setInterval(() => setActive((i) => (i + 1) % (banners?.length || 1)), interval);
    return () => clearInterval(t);
  }, [mounted, banners]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!banners || banners.length === 0) return null;

  const hero = banners.find((b) => b.size === "lg") || banners[0];
  const orbit = banners.filter((b) => b.id !== hero.id);
  const orbitA = orbit[0] || banners[1] || hero;
  const orbitB = orbit[1] || banners[2] || hero;
  const orbitC = orbit[2] || banners[0] || hero;

  const orbitCards = [orbitA, orbitB, orbitC];

  const orbitDuration = hoveringId ? 2.8 : 5.2;

  return (
    <div ref={containerRef} className="mx-auto mt-6 w-full max-w-7xl px-3 sm:px-4">
      <div className="relative overflow-hidden rounded-[2.6rem] border border-cyan-400/15 bg-[#02040d] shadow-[0_0_120px_rgba(34,211,238,0.12)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.24),transparent_24%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.20),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.15),transparent_25%),linear-gradient(135deg,rgba(2,4,13,0.98),rgba(1,3,10,0.94))]" />
        <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px]" />

        <motion.div
          style={{ x: parallaxX, y: parallaxY }}
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <motion.div
            style={{ rotateX: 74, rotateZ: useTransform(depth, [0, 1], [0, 360]) }}
            className="absolute left-1/2 top-1/2 h-[1100px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10"
          />
          <motion.div
            style={{ rotateX: 74, rotateZ: useTransform(depth, [0, 1], [360, 0]) }}
            className="absolute left-1/2 top-1/2 h-[860px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-300/10"
          />
          <div className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 [transform:perspective(1400px)_rotateX(74deg)] animate-spin" />
          <div className="absolute inset-0 bg-[linear-gradient(transparent,rgba(255,255,255,0.035),transparent)] bg-[length:100%_7px] opacity-20 animate-[scanMove_5s_linear_infinite]" />
          <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        </motion.div>

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

            <motion.div style={{ x: parallaxX, y: parallaxY }} className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(0,0,0,0.94)_8%,rgba(0,0,0,0.52)_45%,rgba(0,0,0,0.12)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,0.30),transparent_18%),radial-gradient(circle_at_70%_18%,rgba(168,85,247,0.22),transparent_20%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.14),transparent_26%)]" />
              <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] animate-[scanMove_4.8s_linear_infinite]" />

              <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/15 bg-cyan-300/5 blur-2xl animate-pulse" />
              <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-300/15 bg-fuchsia-300/5 blur-2xl animate-pulse" />
            </motion.div>

            <motion.div
              style={{ x: parallaxX, y: parallaxY }}
              className="relative z-10 flex h-full w-full flex-col justify-between p-6 sm:p-8 lg:p-10"
            >
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
            </motion.div>
          </div>

          <div className="pointer-events-none absolute inset-x-6 top-1/2 hidden -translate-y-1/2 lg:block">
            <div className="relative h-[420px]">
              {orbitCards.map((b, i) => (
                <motion.div
                  key={b.id}
                  className="absolute left-1/2 top-1/2 w-[220px] -translate-x-1/2 -translate-y-1/2"
                  initial={false}
                  onHoverStart={() => setHoveringId(b.id)}
                  onHoverEnd={() => setHoveringId(null)}
                  animate={{
                    x: [0, i === 0 ? -260 : i === 1 ? 0 : 260, 0],
                    y: [0, i === 0 ? -120 : i === 1 ? 160 : -80, 0],
                    scale: hoveringId === b.id ? [0.9, 1.05, 0.92] : [0.88, 1, 0.9],
                    rotateY: hoveringId === b.id ? [22, 0, -22] : [18, 0, -18],
                    opacity: [0.75, 1, 0.78],
                  }}
                  transition={{
                    duration: orbitDuration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.5,
                  }}
                >
                  <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
                    {isValidImageSrc(b.image) && (
                      <Image
                        src={b.image}
                        alt={b.title || "Promo"}
                        width={440}
                        height={290}
                        className="h-[180px] w-full object-cover object-center"
                      />
                    )}
                    <div className="bg-[linear-gradient(135deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.42)_60%,rgba(0,0,0,0.16)_100%)] p-4">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-cyan-100">
                        Orbit {i + 1}
                      </p>
                      <h3 className="mt-2 line-clamp-1 text-sm font-semibold text-white">
                        {b.title || "Special offer"}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/75">
                        {b.subtitle}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-cyan-100">
                          {b.cta || "View more"}
                        </span>
                        <ArrowRightIcon size={14} className="text-white/85" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
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
