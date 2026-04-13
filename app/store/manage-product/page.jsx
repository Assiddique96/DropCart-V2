'use client'
import { useEffect, useState, useRef, Fragment } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { PencilIcon, Trash2Icon, XIcon, CheckIcon, CopyIcon, UploadIcon, DownloadIcon } from "lucide-react"

const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']

export default function StoreManageProducts() {
    const { getToken } = useAuth()
    const { user } = useUser()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [editingProduct, setEditingProduct] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [newImages, setNewImages] = useState([])
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState(null)
    const [cloning, setCloning] = useState(null)
    const [importing, setImporting] = useState(false)
    const csvRef = useRef()

    const cloneProduct = async (productId) => {
        setCloning(productId)
        try {
            const token = await getToken()
            const { data } = await axios.post("/api/store/product/clone", { productId }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success("Product cloned successfully.")
            setProducts(prev => [data.product, ...prev])
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        }
        setCloning(null)
    }

    const handleCSVImport = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImporting(true)
        try {
            const token = await getToken()
            const formData = new FormData()
            formData.append("csv", file)
            const { data } = await axios.post("/api/store/product/bulk-import", formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(data.message)
            fetchProducts()
        } catch (error) {
            const errData = error.response?.data
            if (errData?.errors?.length > 0) {
                toast.error(`${errData.errors.length} row(s) have errors. Check console.`)
                console.table(errData.errors)
            } else {
                toast.error(errData?.error || error.message)
            }
        }
        setImporting(false)
        e.target.value = ""
    }

    const downloadCSVTemplate = () => {
        const header = "name,description,mrp,price,category,quantity,sku,tags,image_url,origin"
        const example = "Sample T-Shirt,A comfortable cotton t-shirt,5000,3500,Clothing,10,TSH-001,fashion|clothing,https://example.com/image.jpg,LOCAL"
        const example2 = "Imported Sneakers,Premium sneakers from abroad,25000,19000,Clothing,5,SNK-001,shoes|imported,https://example.com/sneaker.jpg,ABROAD"
        const blob = new Blob([header + "\n" + example + "\n" + example2], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a"); a.href = url; a.download = "dropcart-import-template.csv"; a.click()
        URL.revokeObjectURL(url)
    }

    const fetchProducts = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get("/api/store/product", {
                headers: { Authorization: `Bearer ${token}` }
            })
            setProducts(data.products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    const toggleStock = async (productId) => {
        try {
            const token = await getToken()
            const { data } = await axios.post("/api/store/stock-toggle", { productId }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setProducts(products.map(p => p.id === productId ? { ...p, inStock: !p.inStock } : p))
            toast.success(data.message)
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        }
    }

    const openEdit = (product) => {
        setEditingProduct(product.id)
        setEditForm({
            name: product.name,
            description: product.description,
            mrp: product.mrp,
            price: product.price,
            category: product.category,
            quantity: product.quantity ?? 0,
            sku: product.sku ?? '',
            tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
            scheduledAt: product.scheduledAt ? new Date(product.scheduledAt).toISOString().slice(0,16) : '',
            origin: product.origin ?? 'LOCAL',
        })
        setNewImages([])
    }

    const cancelEdit = () => {
        setEditingProduct(null)
        setEditForm({})
        setNewImages([])
    }

    const saveEdit = async (productId) => {
        setSaving(true)
        try {
            const token = await getToken()
            const formData = new FormData()
            formData.append("productId", productId)
            formData.append("name", editForm.name)
            formData.append("description", editForm.description)
            formData.append("mrp", editForm.mrp)
            formData.append("price", editForm.price)
            formData.append("category", editForm.category)
            formData.append("quantity", editForm.quantity)
            if (editForm.sku) formData.append("sku", editForm.sku)
            if (editForm.tags) formData.append("tags", editForm.tags)
            if (editForm.scheduledAt) formData.append("scheduledAt", editForm.scheduledAt)
            formData.append("origin", editForm.origin || "LOCAL")
            newImages.forEach(img => formData.append("images", img))

            const { data } = await axios.patch("/api/store/product", formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(data.message)
            setProducts(products.map(p => p.id === productId ? data.product : p))
            cancelEdit()
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        }
        setSaving(false)
    }

    const deleteProduct = async (productId) => {
        setDeletingId(productId)
        try {
            const token = await getToken()
            await axios.delete(`/api/store/product?productId=${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success("Product deleted.")
            setProducts(products.filter(p => p.id !== productId))
            setConfirmDeleteId(null)
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        }
        setDeletingId(null)
    }

    useEffect(() => {
        if (user) fetchProducts()
    }, [user])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <h1 className="text-2xl">Manage <span className="text-slate-800 font-medium">Products</span></h1>
                <div className="flex items-center gap-2">
                    <button onClick={downloadCSVTemplate}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 border border-slate-200 rounded-lg text-slate-500 hover:border-slate-400 transition">
                        <DownloadIcon size={13} /> CSV Template
                    </button>
                    <label className={`flex items-center gap-1.5 text-xs px-3 py-2 border border-slate-200 rounded-lg text-slate-500 hover:border-slate-400 transition cursor-pointer ${importing ? 'opacity-50' : ''}`}>
                        <UploadIcon size={13} /> {importing ? "Importing..." : "Import CSV"}
                        <input type="file" accept=".csv" hidden ref={csvRef} onChange={handleCSVImport} disabled={importing} />
                    </label>
                </div>
            </div>

            {products.length === 0 ? (
                <p className="text-slate-400">No products yet. Add your first product.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3 hidden md:table-cell">Category</th>
                                <th className="px-4 py-3 hidden md:table-cell">MRP</th>
                                <th className="px-4 py-3">Price</th>
                                <th className="px-4 py-3">Qty</th>
                                <th className="px-4 py-3">Stock</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {products.map((product) => (
                                <Fragment key={product.id}>
                                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex gap-3 items-center">
                                                <Image width={44} height={44} className="rounded border border-slate-100 object-cover" src={product.images[0]} alt="" />
                                                <span className="font-medium text-slate-800 max-w-[140px] truncate">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell text-slate-400 text-xs">{product.category}</td>
                                        <td className="px-4 py-3 hidden md:table-cell line-through text-slate-400">{currency}{product.mrp.toLocaleString()}</td>
                                        <td className="px-4 py-3 font-medium text-slate-800">{currency}{product.price.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.quantity > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                                                {product.quantity ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <label className="relative inline-flex items-center cursor-pointer gap-2">
                                                <input type="checkbox" className="sr-only peer"
                                                    onChange={() => toast.promise(toggleStock(product.id), { loading: "Updating..." })}
                                                    checked={product.inStock} />
                                                <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-500 transition-colors duration-200"></div>
                                                <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                            </label>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEdit(product)}
                                                    className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition" title="Edit product">
                                                    <PencilIcon size={15} />
                                                </button>
                                                <button onClick={() => cloneProduct(product.id)} disabled={cloning === product.id}
                                                    className="p-1.5 rounded hover:bg-green-50 text-green-500 transition disabled:opacity-40" title="Clone product">
                                                    <CopyIcon size={15} />
                                                </button>
                                                <button onClick={() => setConfirmDeleteId(product.id)}
                                                    className="p-1.5 rounded hover:bg-red-50 text-red-400 transition" title="Delete product">
                                                    <Trash2Icon size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {editingProduct === product.id && (
                                        <tr key={`edit-${product.id}`} className="bg-blue-50/30">
                                            <td colSpan={7} className="px-4 py-5">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <label className="flex flex-col gap-1 text-xs">
                                                        Name
                                                        <input type="text" value={editForm.name}
                                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                            className="border border-slate-200 rounded p-2 outline-none text-sm bg-white" />
                                                    </label>
                                                    <label className="flex flex-col gap-1 text-xs">
                                                        Category
                                                        <select value={editForm.category}
                                                            onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                                            className="border border-slate-200 rounded p-2 outline-none text-sm bg-white">
                                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </label>
                                                    <label className="flex flex-col gap-1 text-xs">
                                                        MRP ({currency})
                                                        <input type="number" value={editForm.mrp}
                                                            onChange={e => setEditForm({ ...editForm, mrp: e.target.value })}
                                                            className="border border-slate-200 rounded p-2 outline-none text-sm bg-white" />
                                                    </label>
                                                    <label className="flex flex-col gap-1 text-xs">
                                                        Offer Price ({currency})
                                                        <input type="number" value={editForm.price}
                                                            onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                                            className="border border-slate-200 rounded p-2 outline-none text-sm bg-white" />
                                                    </label>
                                                    <label className="flex flex-col gap-1 text-xs">
                                                        Quantity in Stock
                                                        <input type="number" min="0" value={editForm.quantity}
                                                            onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                                                            className="border border-slate-200 rounded p-2 outline-none text-sm bg-white" />
                                                    </label>
                                                    <label className="flex flex-col gap-1 text-xs">
                                                        Shipping Origin
                                                        <select value={editForm.origin ?? 'LOCAL'}
                                                            onChange={e => setEditForm({ ...editForm, origin: e.target.value })}
                                                            className="border border-slate-200 rounded p-2 outline-none text-sm bg-white">
                                                            <option value="LOCAL">🏠 Local Product</option>
                                                            <option value="ABROAD">✈️ Shipped from Abroad</option>
                                                        </select>
                                                    </label>
                                                    <label className="flex flex-col gap-1 text-xs">
                                                        SKU
                                                        <input type="text" value={editForm.sku ?? ''}
                                                            onChange={e => setEditForm({ ...editForm, sku: e.target.value })}
                                                            placeholder="e.g. ABC-001"
                                                            className="border border-slate-200 rounded p-2 outline-none text-sm bg-white" />
                                                    </label>
                                                    <label className="flex flex-col gap-1 text-xs">
                                                        Tags (comma-separated)
                                                        <input type="text" value={editForm.tags ?? ''}
                                                            onChange={e => setEditForm({ ...editForm, tags: e.target.value })}
                                                            placeholder="e.g. fashion, summer"
                                                            className="border border-slate-200 rounded p-2 outline-none text-sm bg-white" />
                                                    </label>
                                                    <label className="flex flex-col gap-1 text-xs">
                                                        Scheduled Publish
                                                        <input type="datetime-local" value={editForm.scheduledAt ?? ''}
                                                            onChange={e => setEditForm({ ...editForm, scheduledAt: e.target.value })}
                                                            className="border border-slate-200 rounded p-2 outline-none text-sm bg-white" />
                                                    </label>
                                                    <label className="flex flex-col gap-1 text-xs">
                                                        Replace Images (optional)
                                                        <input type="file" multiple accept="image/*"
                                                            onChange={e => setNewImages(Array.from(e.target.files))}
                                                            className="text-xs border border-slate-200 rounded p-1.5 bg-white" />
                                                        {newImages.length > 0 && <span className="text-blue-500">{newImages.length} file(s) selected</span>}
                                                    </label>
                                                    <label className="flex flex-col gap-1 text-xs sm:col-span-2 lg:col-span-3">
                                                        Description
                                                        <textarea value={editForm.description} rows={3}
                                                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                            className="border border-slate-200 rounded p-2 outline-none text-sm resize-none bg-white" />
                                                    </label>
                                                </div>
                                                <div className="flex gap-3 mt-4">
                                                    <button onClick={() => saveEdit(product.id)} disabled={saving}
                                                        className="flex items-center gap-1.5 bg-slate-800 text-white px-4 py-1.5 rounded hover:bg-slate-900 transition text-sm disabled:opacity-50">
                                                        <CheckIcon size={14} /> {saving ? "Saving..." : "Save Changes"}
                                                    </button>
                                                    <button onClick={cancelEdit}
                                                        className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-4 py-1.5 rounded hover:bg-slate-200 transition text-sm">
                                                        <XIcon size={14} /> Cancel
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {confirmDeleteId && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Delete Product?</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            This cannot be undone. Products with active orders cannot be deleted.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => deleteProduct(confirmDeleteId)}
                                disabled={deletingId === confirmDeleteId}
                                className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition text-sm disabled:opacity-50">
                                {deletingId === confirmDeleteId ? "Deleting..." : "Yes, Delete"}
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 bg-slate-100 text-slate-700 py-2 rounded hover:bg-slate-200 transition text-sm">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
