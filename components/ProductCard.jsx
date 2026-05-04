"use client";
import { StarIcon, HeartIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleWishlist } from "@/lib/features/wishlist/wishlistSlice";
import { addToCart } from "@/lib/features/cart/cartSlice";
import toast from "react-hot-toast";
import ProductCardImageSwipe from "@/components/ProductCardImageSwipe";

const ProductCard = ({ product }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₦";
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const isWishlisted = wishlistItems.includes(product.id);
  const isAbroad = product.origin === "ABROAD";
  const hasVariants =
    product.variantGroups && product.variantGroups.length > 0;

  const avgRating = product.rating?.length
    ? Math.round(
        product.rating.reduce((acc, r) => acc + r.rating, 0) /
          product.rating.length
      )
    : 0;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlist(product.id));
    toast(
      isWishlisted
        ? "Removed from wishlist"
        : "Added to wishlist ❤️",
      { icon: isWishlisted ? "🤍" : "❤️" }
    );
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ productId: product.id }));
    toast.success("Added to cart");
  };

  return (
    <div className="group relative w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="relative overflow-hidden">
        <ProductCardImageSwipe
          productId={product.id}
          images={product.images}
          name={product.name}
        >
          {isAbroad && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm pointer-events-none">
              ✈️ Abroad
            </div>
          )}
          <button
            type="button"
            onClick={handleWishlist}
            className="absolute top-3 right-3 z-10 rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-sm transition hover:scale-110 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100"
            title={
              isWishlisted
                ? "Remove from wishlist"
                : "Add to wishlist"
            }
          >
            <HeartIcon
              size={16}
              className={
                isWishlisted ? "text-red-500" : "text-slate-700 dark:text-slate-100"
              }
              fill={isWishlisted ? "#ef4444" : "none"}
            />
          </button>
        </ProductCardImageSwipe>
      </div>

      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {product.category}
          </span>
          {product.manufacturer && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {product.manufacturer}
            </span>
          )}
        </div>

        <Link href={`/product/${product.id}`} className="min-w-0">
          <p className="line-clamp-2 font-semibold text-slate-900 dark:text-white">
            {product.name}
          </p>
          <div className="mt-2 flex items-center gap-1">
            {Array(5)
              .fill("")
              .map((_, i) => (
                <StarIcon
                  key={i}
                  size={13}
                  className="text-transparent"
                  fill={avgRating >= i + 1 ? "#00C950" : "#4B5563"}
                />
              ))}
            {product.rating?.length > 0 && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                ({product.rating.length})
              </span>
            )}
          </div>
          {product.mrp > product.price && (
            <p className="mt-2 text-xs text-slate-400 line-through dark:text-slate-500">
              {currency}
              {product.mrp.toLocaleString()}
            </p>
          )}
          <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
            {currency}
            {product.price.toLocaleString()}
          </p>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
