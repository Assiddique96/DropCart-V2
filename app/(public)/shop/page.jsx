'use client'
import { Suspense, useState, useMemo, useEffect } from "react"
import ProductCard from "@/components/ProductCard"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"
import { SlidersHorizontalIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

const CATEGORIES = ['Electronics', 'Clothing', 'Smartphones', 'Solars', 'Accessories', 'Laptops', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']
const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'top_rated', label: 'Top Rated' },
    { value: 'most_reviewed', label: 'Most Reviewed' },
]
const PAGE_SIZE = 12

function ShopContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const allProducts = useSelector(state => state.product.list)

    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [debouncedSearch, setDebouncedSearch] = useState(search)
    const [category, setCategory] = useState(searchParams.get('category') || '')
    const [sort, setSort] = useState('newest')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')
    const [minRating, setMinRating] = useState(0)
    const [inStockOnly, setInStockOnly] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [page, setPage] = useState(1)

    // Debounce search input
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(t)
    }, [search])

    // Reset page when filters change
    useEffect(() => { setPage(1) }, [debouncedSearch, category, sort, minPrice, maxPrice, minRating, inStockOnly])

    const filtered = useMemo(() => {
        let list = [...allProducts]

        // Search
        if (debouncedSearch.trim()) {
            const q = debouncedSearch.toLowerCase()
            list = list.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q)
            )
        }

        // Category
        if (category) list = list.filter(p => p.category === category)

        // Price range
        if (minPrice !== '') list = list.filter(p => p.price >= Number(minPrice))
        if (maxPrice !== '') list = list.filter(p => p.price <= Number(maxPrice))

        // Rating
        if (minRating > 0) {
            list = list.filter(p => {
                const avg = p.rating?.length
                    ? p.rating.reduce((a, r) => a + r.rating, 0) / p.rating.length
                    : 0
                return avg >= minRating
            })
        }

        // In stock only
        if (inStockOnly) list = list.filter(p => p.inStock)

        // Sort
        switch (sort) {
            case 'price_asc': list.sort((a, b) => a.price - b.price); break
            case 'price_desc': list.sort((a, b) => b.price - a.price); break
            case 'top_rated':
                list.sort((a, b) => {
                    const ra = a.rating?.length ? a.rating.reduce((s, r) => s + r.rating, 0) / a.rating.length : 0
                    const rb = b.rating?.length ? b.rating.reduce((s, r) => s + r.rating, 0) / b.rating.length : 0
                    return rb - ra
                }); break
            case 'most_reviewed': list.sort((a, b) => (b.rating?.length || 0) - (a.rating?.length || 0)); break
            default: list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break
        }

        return list
    }, [allProducts, debouncedSearch, category, sort, minPrice, maxPrice, minRating, inStockOnly])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const activeFilterCount = [
        category, minPrice, maxPrice, minRating > 0, inStockOnly
    ].filter(Boolean).length

    const clearFilters = () => {
        setCategory(''); setMinPrice(''); setMaxPrice(''); setMinRating(0); setInStockOnly(false); setSearch('')
    }

    return (
        <div className="min-h-[70vh] mx-6 mb-20">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4 my-6">
                    <div>
                        <h1 className="text-2xl text-slate-700 font-medium">All Products</h1>
                        <p className="text-xs text-slate-400 mt-0.5">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search products..."
                                className="border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none w-56 pr-8"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <XIcon size={14} />
                                </button>
                            )}
                        </div>

                        {/* Sort */}
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none text-slate-600"
                        >
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>

                        {/* Filter toggle */}
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition ${showFilters ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
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
                            <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-red-500 transition flex items-center gap-1">
                                <XIcon size={12} /> Clear all
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-5">
                        {/* Category */}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Category</p>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                            >
                                <option value="">All Categories</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Price range */}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Price Range</p>
                            <div className="flex gap-2">
                                <input type="number" min="0" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                                    placeholder="Min" className="w-1/2 border border-slate-200 rounded-lg p-2 text-sm outline-none" />
                                <input type="number" min="0" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                                    placeholder="Max" className="w-1/2 border border-slate-200 rounded-lg p-2 text-sm outline-none" />
                            </div>
                        </div>

                        {/* Min rating */}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Min Rating</p>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(r => (
                                    <button key={r} onClick={() => setMinRating(minRating === r ? 0 : r)}
                                        className={`px-2 py-1 rounded text-xs border transition ${minRating >= r ? 'bg-green-500 text-white border-green-500' : 'border-slate-200 text-slate-500 hover:border-green-300'}`}>
                                        {r}★
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* In stock */}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Availability</p>
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                                <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)}
                                    className="accent-green-500 w-4 h-4" />
                                In Stock Only
                            </label>
                        </div>
                    </div>
                )}

                {/* Products grid */}
                {paginated.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <p className="text-xl font-medium mb-2">No products found</p>
                        <p className="text-sm">Try adjusting your filters or search term</p>
                        {activeFilterCount > 0 && (
                            <button onClick={clearFilters} className="mt-4 px-5 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900 transition">
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-10">
                        {paginated.map(product => <ProductCard key={product.id} product={product} />)}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-12">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition"
                        >
                            <ChevronLeftIcon size={16} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                            .reduce((acc, p, idx, arr) => {
                                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                                acc.push(p)
                                return acc
                            }, [])
                            .map((p, i) =>
                                p === '...' ? (
                                    <span key={`ellipsis-${i}`} className="px-2 text-slate-400">…</span>
                                ) : (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`w-9 h-9 rounded-lg text-sm transition ${page === p ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                        {p}
                                    </button>
                                )
                            )}

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition"
                        >
                            <ChevronRightIcon size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function Shop() {
    return (
        <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-slate-400">Loading shop...</div>}>
            <ShopContent />
        </Suspense>
    )
}
