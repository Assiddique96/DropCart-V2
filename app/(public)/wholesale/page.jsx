"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * /wholesale — redirects to /shop?wholesale=true so users land
 * on the shop page pre-filtered to wholesale products.
 */
function WholesaleRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("wholesale", "true");
    router.replace(`/shop?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-slate-400 dark:text-slate-500">
      Loading wholesale products…
    </div>
  );
}

export default function WholesalePage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-slate-400">Loading…</div>}>
      <WholesaleRedirect />
    </Suspense>
  );
}
