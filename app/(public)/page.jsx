"use client";

import Hero from "@/components/Hero";
import LatestProducts from "@/components/LatestProducts";
import BestSelling from "@/components/BestSelling";
import OurSpecs from "@/components/OurSpec";
import Newsletter from "@/components/Newsletter";
import MiddleBannerRow, {
  defaultMiddleBanners,
} from "@/components/MiddleBannerRow";
// import InfiniteProductsGrid from "@/components/InfiniteProductsGrid";

export default function Home() {
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
        <MiddleBannerRow banners={defaultMiddleBanners} />
      </section>

      {/* Best selling section */}
      <section className="mt-6">
        <BestSelling />
      </section>

      {/* Infinite scroll product feed (Wildberries‑like long page) */}
      {/* <section className="mt-8">
        <InfiniteProductsGrid />
      </section> */}

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
