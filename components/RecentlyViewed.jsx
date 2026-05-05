"use client";
import { useSelector } from "react-redux";
import ProductCard from "./ProductCard";
import { ClockIcon } from "lucide-react";

/**
 * Shows the last MAX recently viewed products, excluding the current one (if provided).
 * Pass currentProductId to avoid showing the product currently being viewed.
 */
const RecentlyViewed = ({ currentProductId }) => {
  const allProducts = useSelector((state) => state.product.list);
  const viewedIds = useSelector((state) => state.recentlyViewed.ids);

  const recentProducts = viewedIds
    .filter((id) => id !== currentProductId)
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 4);

  if (recentProducts.length === 0) return null;

  return (
    <div className="my-16">
      <div className="mb-6 flex items-center gap-2">
        <ClockIcon
          size={18}
          className="text-slate-400 dark:text-slate-500"
        />
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
          Recently Viewed
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {recentProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;
