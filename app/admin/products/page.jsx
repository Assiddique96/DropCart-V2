'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import Image from "next/image"
import Link from "next/link"
import { SearchIcon, Trash2Icon, XIcon, ExternalLinkIcon } from "lucide-react"

const CATEGORIES = ['Electronics','Clothing','Home & Kitchen','Beauty & Health','Toys & Games','Sports & Outdoors','Books & Media','Food & Drink','Hobbies & Crafts','Others']

export default function AdminProducts() {
    const { getToken } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [category, setCategory] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350)
        return () => clearTimeout(t)
    }, [search])

    useEffect(() => { setPage(1) }, [debouncedSearch, category])

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const token = await getToken()
            const params = new URLSearchParams({ page, ...(debouncedSearch && { search: debouncedSearch }), ...(category && { category }) })
            const { data } = await axios.get(`/api/admin/products?${params}`, { headers: { Authorization: `Bearer ${token}` } })
            setProducts(data.products)
            setTotal(data.total)
            setTotalPages(data.totalPages)
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
        setLoading(false)
    }

    useEffect(() => { fetchProducts() }, [debouncedSearch, category, page])

    const deleteProduct = async (productId) => {
        setDeleting(true)
        try {
            const token = await getToken()
            await axios.delete(`/api/admin/products?productId=${productId}`, { headers: { Authorization: `Bearer ${token}` } })
            toast.success("Product deleted.")
            setProducts(prev => prev.filter(p => p.id !== productId))
            setConfirmDelete(null)
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
        setDeleting(false)
    }

    return (
        <div className="text-slate-500 mb-28">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl">All <span className="text-slate-800 font-medium">Products</span></h1>
                    <p className="text-xs text-slate-400 mt-0.5">{total} total products across all stores</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <div className="relative">
                        <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search products or stores..."
                            className="border border-slate-200 rounded-lg pl-8 pr-8 py-2 text-sm outline-none w-56" />
                        {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"><XIcon size={13} /></button>}
                    </div>
                    <select value={category} onChange={e => setCategory(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none text-slate-600">
                        <option value="">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {loading ? <Loading /> : (
                <>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3 hidden md:table-cell">Store</th>
                                    <th className="px-4 py-3 hidden lg:table-cell">Category</th>
                                    <th className="px-4 py-3">Price</th>
                                    <th className="px-4 py-3 hidden md:table-cell">Origin</th>
                                    <th className="px-4 py-3 hidden lg:table-cell">Orders</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {products.map(product => (
                                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {product.images?.[0] && (
                                                    <Image src={product.images[0]} alt="" width={36} height={36} className="w-9 h-9 rounded object-cover border border-slate-100" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-slate-800 truncate max-w-[140px]">{product.name}</p>
                                                    {product.sku && <p className="text-xs text-slate-400">{product.sku}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <Link href={`/shop/${product.store?.username}`} target="_blank"
                                                className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                                                {product.store?.name} <ExternalLinkIcon size={10} />
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-400">{product.category}</td>
                                        <td className="px-4 py-3 font-medium">{currency}{product.price.toLocaleString()}</td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.origin === 'ABROAD' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                                {product.origin === 'ABROAD' ? '✈️ Abroad' : '🏠 Local'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-400">{product._count?.orderItems ?? 0}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Link href={`/product/${product.id}`} target="_blank"
                                                    className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
                                                    <ExternalLinkIcon size={13} />
                                                </Link>
                                                <button onClick={() => setConfirmDelete(product)}
                                                    className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition">
                                                    <Trash2Icon size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-12 text-slate-400">No products found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-lg text-sm transition ${page === p ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {confirmDelete && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="font-semibold text-slate-800 mb-1">Delete Product?</h3>
                        <p className="text-sm text-slate-500 mb-1"><span className="font-medium">{confirmDelete.name}</span></p>
                        <p className="text-xs text-slate-400 mb-4">From store: {confirmDelete.store?.name}. This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => deleteProduct(confirmDelete.id)} disabled={deleting}
                                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition disabled:opacity-50">
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                                className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-200 transition">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
