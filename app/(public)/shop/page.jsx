"use client";
import { Suspense, useState, useMemo, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import {
  SlidersHorizontalIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PackageIcon,
} from "lucide-react";

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Smartphones",
  "Solars",
  "Accessories",
  "Laptops",
  "Home & Garden",
  "Beauty & Health",
  "Toys & Games",
  "Sports & Outdoors",
  "Books & Media",
  "Food & Beverage",
  "Hobbies & Crafts",
  "Automotive",
  "Baby & Kids",
  "Pet Supplies",
  "Office Supplies",
  "Industrial & Scientific",
  "Others",
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "top_rated", label: "Top Rated" },
  { value: "most_reviewed", label: "Most Reviewed" },
  { value: "popular", label: "Most Popular" },
  { value: "discount", label: "Biggest Discount" },
];
const PAGE_SIZE = 12;

function resolveInitialSort(searchParams) {
  const sortParam = searchParams.get("sort");
  const tagParam = searchParams.get("tag");

  if (sortParam === "newest" || tagParam === "new") return "newest";
  if (sortParam === "popular" || tagParam === "top") return "popular";
  if (sortParam === "rating") return "top_rated";
  if (sortParam === "discount") return "discount";
  if (sortParam === "promo" || tagParam === "offers") return "discount";
  if (sortParam === "price_asc") return "price_asc";
  if (sortParam === "price_desc") return "price_desc";
  return "newest";
}

function resolvePageTitle(searchParams) {
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort");
  const origin = searchParams.get("origin");
  const isWholesale = searchParams.get("wholesale");
  const maxPrice = searchParams.get("maxPrice");

  if (isWholesale === "true") return "Wholesale Products";
  if (origin === "abroad") return "Shipped from Abroad";
  if (tag === "new" || sort === "newest") return "New Arrivals";
  if (tag === "top" || sort === "popular") return "Best Sellers";
  if (tag === "offers" || sort === "promo") return "Special Offers";
  if (sort === "discount") return "Biggest Discounts";
  if (sort === "rating") return "Top Rated";
  if (maxPrice) return `Products Under ₦${Number(maxPrice).toLocaleString()}`;
  return "All Products";
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const allProducts = useSelector((state) => state.product.list);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState(() => resolveInitialSort(searchParams));
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [wholesaleOnly, setWholesaleOnly] = useState(
    searchParams.get("wholesale") === "true"
  );
  const [originFilter, setOriginFilter] = useState(
    searchParams.get("origin") || ""
  );
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const pageTitle = resolvePageTitle(searchParams);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    category,
    sort,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    wholesaleOnly,
    originFilter,
  ]);

  const filtered = useMemo(() => {
    let list = [...allProducts];

    // Search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    // Category
    if (category) list = list.filter((p) => p.category === category);

    // Wholesale
    if (wholesaleOnly) list = list.filter((p) => p.isWholesale);

    // Origin
    if (originFilter === "abroad")
      list = list.filter((p) => p.origin === "ABROAD");
    else if (originFilter === "local")
      list = list.filter((p) => p.origin !== "ABROAD");

    // Price range
    if (minPrice !== "") list = list.filter((p) => p.price >= Number(minPrice));
    if (maxPrice !== "") list = list.filter((p) => p.price <= Number(maxPrice));

    // Rating
    if (minRating > 0) {
      list = list.filter((p) => {
        const avg = p.rating?.length
          ? p.rating.reduce((a, r) => a + r.rating, 0) / p.rating.length
          : 0;
        return avg >= minRating;
      });
    }

    // In stock only
    if (inStockOnly) list = list.filter((p) => p.inStock);

    // Sort
    switch (sort) {
      case "price_asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "top_rated":
        list.sort((a, b) => {
          const ra = a.rating?.length
            ? a.rating.reduce((s, r) => s + r.rating, 0) / a.rating.length
            : 0;
          const rb = b.rating?.length
            ? b.rating.reduce((s, r) => s + r.rating, 0) / b.rating.length
            : 0;
          return rb - ra;
        });
        break;
      case "most_reviewed":
        list.sort(
          (a, b) => (b.rating?.length || 0) - (a.rating?.length || 0)
        );
        break;
      case "popular":
        // More orders + better rating = more popular
        list.sort(
          (a, b) => (b.rating?.length || 0) - (a.rating?.length || 0)
        );
        break;
      case "discount":
        list.sort((a, b) => {
          const discA =
            a.mrp > 0 ? ((a.mrp - a.price) / a.mrp) * 100 : 0;
          const discB =
            b.mrp > 0 ? ((b.mrp - b.price) / b.mrp) * 100 : 0;
          return discB - discA;
        });
        break;
      default:
        list.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    return list;
  }, [
    allProducts,
    debouncedSearch,
    category,
    sort,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    wholesaleOnly,
    originFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const activeFilterCount = [
    category,
    minPrice,
    maxPrice,
    minRating > 0,
    inStockOnly,
    wholesaleOnly,
    originFilter,
  ].filter(Boolean).length;

  const groupedPaginatedProducts = useMemo(() => {
    const groups = {};
    paginated.forEach((product) => {
      const group = CATEGORIES.includes(product.category)
        ? product.category
        : "Others";
      if (!groups[group]) groups[group] = [];
      groups[group].push(product);
    });
    return Object.entries(groups).sort(
      ([a], [b]) => CATEGORIES.indexOf(a) - CATEGORIES.indexOf(b)
    );
  }, [paginated]);

  const clearFilters = () => {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setInStockOnly(false);
    setWholesaleOnly(false);
    setOriginFilter("");
    setSearch("");
  };

  return (
    <div className="min-h-[70vh] mx-6 mb-20 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 my-6">
          <div>
            <h1 className="text-3xl text-slate-800 dark:text-slate-50 font-semibold">
              {pageTitle}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 max-w-xl">
              Discover top-rated products from verified sellers. Use filters to
              refine results by price, category, rating, and availability.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
            </p>

            {/* Wholesale badge */}
            {wholesaleOnly && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-600">
                <PackageIcon size={13} /> Wholesale / Bulk Pricing
              </div>
            )}

            {/* Category pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setCategory("")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  category === ""
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    category === c
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-4 py-2 text-sm outline-none w-56 pr-8 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <XIcon size={14} />
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-900"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition ${
                showFilters
                  ? "bg-slate-800 text-white border-slate-800 dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-200 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200"
              }`}
            >
              <SlidersHorizontalIcon size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-400 hover:text-red-500 transition flex items-center gap-1"
              >
                <XIcon size={12} /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {/* Category */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase mb-2">
                Category
              </p>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase mb-2">
                Price Range
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-1/2 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-1/2 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Min rating */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase mb-2">
                Min Rating
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(minRating === r ? 0 : r)}
                    className={`px-2 py-1 rounded text-xs border transition ${
                      minRating >= r
                        ? "bg-green-500 text-white border-green-500"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300"
                    }`}
                  >
                    {r}★
                  </button>
                ))}
              </div>
            </div>

            {/* Origin */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase mb-2">
                Origin
              </p>
              <select
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="">All</option>
                <option value="local">Local / Nigeria</option>
                <option value="abroad">Shipped from Abroad</option>
              </select>
            </div>

            {/* Availability / Wholesale */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase mb-2">
                Availability
              </p>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-200 mb-2">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-green-500 w-4 h-4"
                />
                In Stock Only
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={wholesaleOnly}
                  onChange={(e) => setWholesaleOnly(e.target.checked)}
                  className="accent-amber-500 w-4 h-4"
                />
                Wholesale Only
              </label>
            </div>
          </div>
        )}

        {/* Products grid */}
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
            <p className="text-xl font-medium mb-2">No products found</p>
            <p className="text-sm">Try adjusting your filters or search term</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 px-5 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {groupedPaginatedProducts.map(([group, products]) => (
              <section key={group}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-50">
                      {group}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                      {products.length} product{products.length !== 1 ? "s" : ""} in this category.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200">
                    Category showcase
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-10">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
            >
              <ChevronLeftIcon size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - page) <= 1
              )
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm transition ${
                      page === p
                        ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center text-slate-400">
          Loading shop...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
