"use client";

import Hero from "@/components/Hero";
import LatestProducts from "@/components/LatestProducts";
import BestSelling from "@/components/BestSelling";
import OurSpecs from "@/components/OurSpec";
import Newsletter from "@/components/Newsletter";
import MiddleBannerRow, {
  defaultMiddleBanners,
} from "@/components/MiddleBannerRow";
import { useEffect, useState } from "react";

export default function Home() {
  const [middleBanners, setMiddleBanners] = useState(defaultMiddleBanners);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/home/middle-banner");
        const { banners } = await res.json();
        if (!cancelled && Array.isArray(banners) && banners.length > 0) {
          setMiddleBanners(banners);
        }
      } catch {
        // keep defaults
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* Top hero section */}
      <Hero />

      {/* Latest products strip */}
      <section className="mt-6">
        <LatestProducts />
      </section>

      {/* Flash deals / International shipping / Installment plans */}
      <section className="mt-4">
        <MiddleBannerRow banners={middleBanners} />
      </section>

      {/* Best selling section */}
      <section className="mt-6">
        <BestSelling />
      </section>

      {/* Info / trust / specs + newsletter */}
      <section className="mt-10">
        <OurSpecs />
      </section>

      <section className="mt-8 mb-10">
        <Newsletter />
      </section>
    </div>
  );
}
