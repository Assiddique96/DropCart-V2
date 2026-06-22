// components/FilterSidebar.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function FilterSidebar() {
  const router = useRouter();
  const params = useSearchParams();

  const [priceRange, setPriceRange] = useState(() => {
    const min = params.get("minPrice") || 0;
    const max = params.get("maxPrice") || 1000000;
    return [Number(min), Number(max)];
  });

  const [selectedBrands, setSelectedBrands] = useState(
    params.get("brands")?.split(",") || []
  );

  const [selectedCategory, setSelectedCategory] = useState(
    params.get("category") || ""
  );

  const [minRating, setMinRating] = useState(params.get("minRating") || 0);
  const [inStockOnly, setinStockOnly] = useState(
    params.get("inStock") === "true"
  );

  const [sort, setSort] = useState(params.get("sort") || "default");

  const applyFilters = () => {
    const newParams = new URLSearchParams();

    if (priceRange[0] > 0) newParams.set("minPrice", priceRange[0]);
    if (priceRange[1] < 1000000) newParams.set("maxPrice", priceRange[1]);

    if (selectedBrands.length) newParams.set("brands", selectedBrands.join(","));
    if (selectedCategory) newParams.set("category", selectedCategory);
    if (minRating > 0) newParams.set("minRating", minRating);
    if (inStockOnly) newParams.set("inStock", "true");

    if (sort !== "default") newParams.set("sort", sort);

    const q = params.get("q");
    if (q) newParams.set("q", q);

    router.push(`/shop?${newParams.toString()}`, { scroll: false });
  };

  return (
    <aside className="w-full md:w-64 px-3 py-4 border-r border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-bold mb-4">Filters</h2>

      {/* Price Range */}
      <div className="mb-4">
        <p className="font-semibold mb-2">Price</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) =>
              setPriceRange([Number(e.target.value), priceRange[1]])
            }
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="Min"
          />
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([priceRange[0], Number(e.target.value)])
            }
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="Max"
          />
        </div>
      </div>

      {/* Brands */}
      <div className="mb-4">
        <p className="font-semibold mb-2">Brands</p>
        <div className="flex flex-wrap gap-2">
          {["Samsung", "Apple", "HP", "Dell", "Lenovo"].map((brand) => {
            const active = selectedBrands.includes(brand);
            return (
              <button
                key={brand}
                onClick={() => {
                  setSelectedBrands((prev) =>
                    active
                      ? prev.filter((b) => b !== brand)
                      : [...prev, brand]
                  );
                }}
                className={`px-2 py-1 text-xs rounded-full border ${
                  active
                    ? "bg-slate-900 text-white dark:bg-slate-700"
                    : "bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category */}
      <div className="mb-4">
        <p className="font-semibold mb-2">Category</p>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm"
        >
          <option value="">All</option>
          <option value="smartphones">Smartphones</option>
          <option value="computers">Computers</option>
          <option value="electronics">Electronics</option>
        </select>
      </div>

      {/* Min Rating */}
      <div className="mb-4">
        <p className="font-semibold mb-2">Min Rating</p>
        <select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="w-full px-2 py-1 border rounded text-sm"
        >
          <option value={0}>Any</option>
          <option value={4}>4+</option>
          <option value={4.5}>4.5+</option>
          <option value={5}>5</option>
        </select>
      </div>

      {/* In Stock */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setinStockOnly(e.target.checked)}
          />
          In stock only
        </label>
      </div>

      {/* Sort */}
      <div className="mb-4">
        <p className="font-semibold mb-2">Sort</p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm"
        >
          <option value="default">Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
          <option value="new">Newest</option>
          <option value="discount">Biggest Discount</option>
        </select>
      </div>

      <button
        onClick={applyFilters}
        className="w-full px-3 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800"
      >
        Apply Filters
      </button>
    </aside>
  );
}
