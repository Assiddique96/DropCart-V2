"use client";
import { useSelector } from "react-redux";
import ProductCard from "./ProductCard";

/**
 * Shows up to 4 products from the same category, excluding the current product.
 * Falls back to products from the same store if same-category count < 2.
 */
const RelatedProducts = ({ product }) => {
  const allProducts = useSelector((state) => state.product.list);

  const sameCategory = allProducts
    .filter(
      (p) => p.id !== product.id && p.category === product.category
    )
    .slice(0, 4);

  const sameStore = allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        p.store?.username === product.store?.username
    )
    .slice(0, 4);

  const related =
    sameCategory.length >= 2 ? sameCategory : sameStore;

  if (related.length === 0) return null;

  const isCategoryMode = sameCategory.length >= 2;

  return (
    <div className="my-16">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
          {isCategoryMode ? "More in " : "More from "}
          <span className="text-green-500">
            {isCategoryMode
              ? product.category
              : product.store?.name || "this store"}
          </span>
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
