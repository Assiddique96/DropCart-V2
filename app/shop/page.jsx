// app/shop/page.jsx
"use client";

import FilterSidebar from "@/components/FilterSidebar";

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-7xl flex flex-col md:flex-row">
      <FilterSidebar />
      <div className="flex-1 px-3 py-4">
        {/* Product grid */}
        <p>Products will be fetched with filters from URL.</p>
      </div>
    </div>
  );
}
