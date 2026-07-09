"use client";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MailIcon, MapPinIcon, ShieldCheckIcon, AlertCircleIcon, StarIcon, StoreIcon, ClockIcon, EyeIcon } from "lucide-react";
import Loading from "@/components/Loading";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { rootHref } from "@/lib/subdomain";

export default function StoreShopPageClient() {
  const { username } = useParams();
  const { getToken, isLoaded } = useAuth();
  const [products, setProducts] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStoreData = async () => {
    setLoading(true);
    setErrorType(null);
    try {
      const token = await getToken().catch(() => null);
      const { data } = await axios.get(`/api/store/data?username=${username}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setStoreInfo(data.store);
      setProducts(data.store.Product);
    } catch (error) {
      const code = error.response?.data?.error;
      setErrorType(code === "not_found" ? "not_found" : "not_active");
      if (code !== "not_found" && code !== "not_active") {
        toast.error(code || error.message);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isLoaded) fetchStoreData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, isLoaded]);

  if (!loading && errorType === "not_found") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <StoreIcon className="w-14 h-14 text-slate-300 dark:text-slate-700 mb-4" />
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Store not found</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">This store may have been renamed, or the address is incorrect.</p>
        <Link
          href={rootHref("/shop")}
          className="mt-6 inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium hover:opacity-90 transition-all"
        >
          Browse all stores
        </Link>
      </div>
    );
  }

  if (!loading && errorType === "not_active") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <ClockIcon className="w-14 h-14 text-slate-300 dark:text-slate-700 mb-4" />
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">This store isn&apos;t live yet</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">It may be new, temporarily paused, or no longer accepting orders. Check back later.</p>
        <Link
          href={rootHref("/shop")}
          className="mt-6 inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium hover:opacity-90 transition-all"
        >
          Browse all stores
        </Link>
      </div>
    );
  }

  return !loading ? (
    <div className="min-h-[70vh] mx-6 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {storeInfo?.preview && (
        <div className="max-w-7xl mx-auto mt-6 flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <EyeIcon className="w-4 h-4 shrink-0" />
          <span>
            <strong>Preview only</strong> — visitors can&apos;t see this yet. Your store status is{" "}
            <strong className="capitalize">{storeInfo.status}</strong>
            {storeInfo.verificationStatus === "unverified" && " and unverified"}. It&apos;ll go live once approved.
          </span>
        </div>
      )}

      {storeInfo && (
        <div
          className={`max-w-7xl mx-auto mt-6 relative overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs min-h-[200px] md:min-h-[220px] ${
            storeInfo.banner ? "" : "bg-slate-50 dark:bg-slate-900"
          }`}
        >
          {storeInfo.banner ? (
            <>
              <Image
                src={storeInfo.banner}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
                priority
              />
              <div
                className="absolute inset-0 bg-gradient-to-br from-white/92 via-white/85 to-slate-50/78 dark:from-slate-950/95 dark:via-slate-950/85 dark:to-slate-900/80 backdrop-blur-[1px]"
                aria-hidden
              />
            </>
          ) : null}
          <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-center gap-6">
            <Image
              src={storeInfo.logo}
              alt={storeInfo.name}
              className="size-32 sm:size-38 object-cover border-2 border-slate-100 dark:border-slate-700 rounded-md shadow-sm bg-white dark:bg-slate-900"
              width={200}
              height={200}
            />
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-50">{storeInfo.name}</h1>
                {storeInfo.verificationStatus === "verified" && (
                  <ShieldCheckIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" title="Verified Store" />
                )}
                {storeInfo.verificationStatus === "unverified" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-full text-xs font-semibold text-amber-800 dark:text-amber-200">
                    <AlertCircleIcon className="w-3.5 h-3.5" />
                    UNVERIFIED
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-lg">{storeInfo.description}</p>
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm mt-3 text-slate-500 dark:text-slate-300">
                <StarIcon className="w-4 h-4 text-amber-400" />
                {storeInfo.storeRatingCount > 0 ? (
                  <>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{storeInfo.storeRatingAvg.toFixed(1)}</span>
                    <span>
                      ({storeInfo.storeRatingCount} review{storeInfo.storeRatingCount !== 1 ? "s" : ""})
                    </span>
                  </>
                ) : (
                  <span>No reviews yet</span>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-4 space-y-1" />
              <div className="space-y-2 text-sm text-slate-500 dark:text-slate-300">
                <div className="flex items-center justify-center md:justify-start">
                  <MapPinIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2 shrink-0" />
                  <span>{storeInfo.address}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start">
                  <MailIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2 shrink-0" />
                  <span>{storeInfo.email}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start">
                  <span className="text-xs uppercase tracking-wide font-medium text-slate-600 dark:text-slate-400">ADDED ON:</span>
                  <span className="ml-2">{new Date(storeInfo.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto mb-40">
        <h1 className="text-2xl mt-12">
          Shop <span className="text-slate-800 dark:text-slate-50 font-medium">Products</span>
        </h1>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
}
