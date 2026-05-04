"use client";
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import RelatedProducts from "@/components/RelatedProducts";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addRecentlyViewed } from "@/lib/features/recentlyViewed/recentlyViewedSlice";
import {
  FacebookIcon,
  TwitterIcon,
  LinkIcon,
  CheckIcon,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function Product() {
  const { productId } = useParams();
  const [product, setProduct] = useState();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const products = useSelector((state) => state.product.list);
  const dispatch = useDispatch();

  useEffect(() => {
    const loadProduct = async () => {
      const found = products.find((p) => p.id === productId);
      if (found) {
        setProduct(found);
        setLoading(false);
        dispatch(addRecentlyViewed(productId));
        return;
      }

      try {
        const { data } = await axios.get("/api/products");
        const apiProduct = data.products?.find(
          (p) => p.id === productId
        );
        if (apiProduct) {
          setProduct(apiProduct);
          dispatch(addRecentlyViewed(productId));
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
    scrollTo(0, 0);
  }, [productId, products, dispatch]);

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";
  const shareText = product
    ? `Check out ${product.name} on Shpinx`
    : "Check this out on Shpinx";

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const shareOnTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const shareOnWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        shareText + " " + shareUrl
      )}`,
      "_blank"
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("input");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-6">
      <div className="mx-auto max-w-7xl">
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-slate-700 dark:border-slate-200" />
              <p className="text-slate-600 dark:text-slate-300">
                Loading product...
              </p>
            </div>
          </div>
        ) : product ? (
          <>
            {/* Breadcrumb */}
            <div className="mt-8 mb-5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
              <span>Home</span>
              <span>/</span>
              <span>Products</span>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">
                {product.category}
              </span>
            </div>

            {/* Product Details */}
            <ProductDetails product={product} />

            {/* Social sharing */}
            <div className="mt-8 flex items-center gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Share
              </span>
              <button
                onClick={shareOnWhatsApp}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-green-400 hover:text-green-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-green-400"
              >
                <span className="text-sm">💬</span> WhatsApp
              </button>
              <button
                onClick={shareOnFacebook}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400"
              >
                <FacebookIcon size={13} /> Facebook
              </button>
              <button
                onClick={shareOnTwitter}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-sky-400"
              >
                <TwitterIcon size={13} /> X / Twitter
              </button>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
              >
                {copied ? (
                  <CheckIcon
                    size={13}
                    className="text-green-500"
                  />
                ) : (
                  <LinkIcon size={13} />
                )}
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>

            {/* Description & Reviews */}
            <ProductDescription product={product} />

            {/* Related products */}
            <RelatedProducts product={product} />

            {/* Recently viewed */}
            <RecentlyViewed currentProductId={productId} />
          </>
        ) : (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <h1 className="mb-4 text-4xl font-bold text-slate-800 dark:text-white">
                404
              </h1>
              <p className="mb-8 text-slate-600 dark:text-slate-300">
                Product not found
              </p>
              <Link
                href="/"
                className="rounded-lg bg-slate-700 px-6 py-2 text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                Go Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
