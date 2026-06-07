'use client'
import { useEffect, useState, useRef, Fragment } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { PencilIcon, Trash2Icon, XIcon, CheckIcon, CopyIcon, UploadIcon, DownloadIcon, PlusIcon } from "lucide-react"
import { getStoreAuthHeaders } from "@/lib/storeAuthHeaders"

const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Beverage', 'Hobbies & Crafts', 'Automotive', 'Baby & Kids', 'Pet Supplies', 'Office Supplies', 'Industrial & Scientific', 'Accessories', 'Smartphones', 'Laptops', 'Solars', 'Others']

const manufacturers = {
    'Electronics': ['Samsung', 'Apple', 'Sony', 'LG', 'Huawei', 'Xiaomi', 'OnePlus', 'Google', 'Microsoft', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Nokia', 'Motorola', 'Oppo', 'Vivo', 'Realme', 'Others'],
    'Clothing': ['Nike', 'Adidas', 'Puma', 'Levi\'s', 'H&M', 'Zara', 'Uniqlo', 'Gucci', 'Louis Vuitton', 'Chanel', 'Prada', 'Versace', 'Armani', 'Tommy Hilfiger', 'Ralph Lauren', 'Calvin Klein', 'Gap', 'Old Navy', 'Banana Republic', 'Others'],
    'Home & Garden': ['IKEA', 'Home Depot', 'Lowe\'s', 'Wayfair', 'Crate & Barrel', 'Williams Sonoma', 'Bed Bath & Beyond', 'Pottery Barn', 'West Elm', 'CB2', 'Anthropologie', 'Restoration Hardware', 'Hobby Lobby', 'Michaels', 'Joann', 'Others'],
    'Beauty & Health': ['L\'Oréal', 'Estée Lauder', 'Maybelline', 'Revlon', 'MAC', 'NARS', 'Clinique', 'The Body Shop', 'Bath & Body Works', 'Victoria\'s Secret', 'Sephora', 'Ulta', 'Avon', 'Mary Kay', 'Neutrogena', 'Cetaphil', 'Olay', 'Nivea', 'Dove', 'Others'],
    'Toys & Games': ['LEGO', 'Mattel', 'Hasbro', 'Fisher-Price', 'Nintendo', 'Sony PlayStation', 'Microsoft Xbox', 'Disney', 'Marvel', 'DC Comics', 'Pokémon', 'Barbie', 'Hot Wheels', 'Transformers', 'Others'],
    'Sports & Outdoors': ['Nike', 'Adidas', 'Puma', 'Under Armour', 'Reebok', 'New Balance', 'The North Face', 'Patagonia', 'Columbia', 'REI', 'Decathlon', 'Dick\'s Sporting Goods', 'Academy Sports', 'Bass Pro Shops', 'Cabela\'s', 'Others'],
    'Books & Media': ['Penguin Random House', 'HarperCollins', 'Simon & Schuster', 'Hachette', 'Macmillan', 'Scholastic', 'Disney', 'Warner Bros', 'Universal', 'Sony Pictures', 'Netflix', 'Amazon Prime', 'HBO', 'Others'],
    'Food & Beverage': ['Nestlé', 'PepsiCo', 'Coca-Cola', 'Unilever', 'Procter & Gamble', 'Kraft Heinz', 'Mondelez', 'Mars', 'Ferrero', 'Lindt', 'Starbucks', 'McDonald\'s', 'KFC', 'Subway', 'Domino\'s', 'Others'],
    'Hobbies & Crafts': ['Michaels', 'Hobby Lobby', 'Joann', 'Dick Blick', 'Ben Franklin', 'LEGO', 'Copic', 'Prismacolor', 'Faber-Castell', 'Staedtler', 'Pentel', 'Sharpie', 'Crayola', 'Others'],
    'Automotive': ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Nissan', 'Hyundai', 'Kia', 'Tesla', 'General Motors', 'Fiat', 'Renault', 'Peugeot', 'Others'],
    'Baby & Kids': ['Pampers', 'Huggies', 'Johnson & Johnson', 'Gerber', 'Enfamil', 'Similac', 'Fisher-Price', 'LeapFrog', 'VTech', 'Disney', 'Nickelodeon', 'Cartoon Network', 'Sesame Street', 'Mattel', 'Hasbro', 'Others'],
    'Pet Supplies': ['Purina', 'Pedigree', 'Whiskas', 'Royal Canin', 'Hill\'s', 'Iams', 'Eukanuba', 'Blue Buffalo', 'Science Diet', 'Taste of the Wild', 'Acana', 'Orijen', 'Petco', 'PetSmart', 'Chewy', 'Others'],
    'Office Supplies': ['Staples', 'Office Depot', 'OfficeMax', 'Amazon Basics', 'HP', 'Dell', 'Lenovo', 'Apple', 'Microsoft', 'Adobe', 'Google', 'Canon', 'Epson', 'Brother', 'Sharp', 'Others'],
    'Industrial & Scientific': ['3M', 'Honeywell', 'DuPont', 'Dow Chemical', 'BASF', 'Siemens', 'General Electric', 'Philips', 'Bosch', 'Makita', 'DeWalt', 'Milwaukee', 'Ridgid', 'Snap-on', 'Others'],
    'Accessories': ['Samsung', 'Apple', 'Sony', 'LG', 'Huawei', 'Xiaomi', 'OnePlus', 'Google', 'Microsoft', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Nokia', 'Motorola', 'Oppo', 'Vivo', 'Realme', 'Others'],
    'Smartphones': ['Samsung', 'Apple', 'Sony', 'LG', 'Huawei', 'Xiaomi', 'OnePlus', 'Google', 'Microsoft', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Nokia', 'Motorola', 'Oppo', 'Vivo', 'Realme', 'Others'],
    'Laptops': ['Hp', 'Apple', 'Samsung', 'Lenovo', 'Sony', 'Dell', 'ASUS', 'Acer', 'Toshiba', 'Others'],
    'Solars': ['JA Solar', 'Trina Solar', 'Canadian Solar', 'Hanwha Q Cells', 'Jinko Solar', 'LONGi Solar', 'Risen Energy', 'Sunnova', 'Sunrun', 'Vivint Solar', 'Others'],
    'Others': ['Generic', 'Unknown', 'Various', 'Others']
}

export default function StoreManageProducts() {
    const { getToken } = useAuth()
    const { user } = useUser()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [editingProduct, setEditingProduct] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [newImages, setNewImages] = useState([])
    /** URLs kept when editing (remove = drop from this list). */
    const [editImageUrls, setEditImageUrls] = useState([])
    const [variantGroups, setVariantGroups] = useState([])
    const [newVariantGroupLabel, setNewVariantGroupLabel] = useState("")
    const [newVariantGroupType, setNewVariantGroupType] = useState("TEXT")
    const [newVariantOptionInputs, setNewVariantOptionInputs] = useState({})
    // Wholesale state for edit modal
    const [editIsWholesale, setEditIsWholesale] = useState(false)
    const [editWholesaleTiers, setEditWholesaleTiers] = useState([])
    const [editNewTier, setEditNewTier] = useState({ minQty: "", maxQty: "", price: "" })
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState(null)
    const [requestingAd, setRequestingAd] = useState(null)
    const [cloning, setCloning] = useState(null)
    const [importing, setImporting] = useState(false)
    const csvRef = useRef()

    const parsePrice = (value) => {
        const price = parseFloat(value)
        return Number.isFinite(price) ? price : 0
    }

    const computeVariantPriceModifier = (optionPrice, basePrice) => {
        const price = parsePrice(optionPrice)
        const base = parsePrice(basePrice)
        return Number.isFinite(price) && Number.isFinite(base) ? price - base : 0
    }

    const currentEditingProduct = products.find((product) => product.id === editingProduct)

    const renderEditForm = (product) => (
        <div className="rounded-3xl border border-blue-100 bg-blue-50/80 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit product</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Update details, images and variant groups.</p>
                </div>
                <button type="button" onClick={cancelEdit}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <XIcon size={14} /> Close
                </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs">
                    Name
                    <input type="text" value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className="border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm bg-white dark:bg-slate-900" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                    Category
                    <select value={editForm.category}
                        onChange={e => setEditForm({ ...editForm, category: e.target.value, manufacturer: "" })}
                        className="border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm bg-white dark:bg-slate-900">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-xs">
                    Manufacturer
                    <select value={editForm.manufacturer ?? ''}
                        onChange={e => setEditForm({ ...editForm, manufacturer: e.target.value })}
                        className="border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm bg-white dark:bg-slate-900">
                        <option value="">Select manufacturer</option>
                        {editForm.category && manufacturers[editForm.category]?.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-xs">
                    Material
                    <input type="text" value={editForm.material ?? ''}
                        onChange={e => setEditForm({ ...editForm, material: e.target.value })}
                        placeholder="e.g. Cotton, Steel"
                        className="border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm bg-white dark:bg-slate-900" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                    Guarantee Period
                    <input type="text" value={editForm.guaranteePeriod ?? ''}
                        onChange={e => setEditForm({ ...editForm, guaranteePeriod: e.target.value })}
                        placeholder="e.g. 1 year"
                        className="border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm bg-white dark:bg-slate-900" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                    MRP ({currency})
                    <input type="number" value={editForm.mrp}
                        onChange={e => setEditForm({ ...editForm, mrp: e.target.value })}
                        className="border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm bg-white dark:bg-slate-900" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                    Offer Price ({currency})
                    <input type="number" value={editForm.price}
                        onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                        className="border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm bg-white dark:bg-slate-900" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                    Quantity in Stock
                    <input type="number" min="0" value={editForm.quantity}
                        onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                        className="border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm bg-white dark:bg-slate-900" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                    Shipping Origin
                    <select value={editForm.origin ?? 'LOCAL'}
                        onChange={(e) => {
                            const v = e.target.value
                            setEditForm((f) => ({
                                ...f,
                                origin: v,
                                acceptCod: v === 'LOCAL' ? (f.origin === 'ABROAD' ? true : f.acceptCod !== false) : false,
                                deliveryWithinState: v === 'LOCAL' ? f.deliveryWithinState : false,
                                deliveryNationwide: v === 'LOCAL' ? f.deliveryNationwide : false,
                                deliveryInternational: v === 'ABROAD' ? true : f.deliveryInternational,
                            }))
                        }}
                        className="border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm bg-white dark:bg-slate-900">
                        <option value="LOCAL">🏠 Local Product</option>
                        <option value="ABROAD">✈️ Shipped from Abroad</option>
                    </select>
                </label>
                <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Available delivery methods</p>
                    <div className="grid gap-3 md:grid-cols-3">
                        <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer dark:bg-slate-900 ${editForm.origin === 'ABROAD' ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed dark:border-slate-700 dark:bg-slate-950' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
                            <input
                                type="checkbox"
                                checked={!!editForm.deliveryWithinState}
                                onChange={e => setEditForm({ ...editForm, deliveryWithinState: e.target.checked })}
                                disabled={editForm.origin === 'ABROAD'}
                                className="accent-green-600"
                            />
                            <span className="text-sm">Within State</span>
                        </label>
                        <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer dark:bg-slate-900 ${editForm.origin === 'ABROAD' ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed dark:border-slate-700 dark:bg-slate-950' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
                            <input
                                type="checkbox"
                                checked={!!editForm.deliveryNationwide}
                                onChange={e => setEditForm({ ...editForm, deliveryNationwide: e.target.checked })}
                                disabled={editForm.origin === 'ABROAD'}
                                className="accent-green-600"
                            />
                            <span className="text-sm">Nationwide</span>
                        </label>
                        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 cursor-pointer dark:border-slate-700 dark:bg-slate-900">
                            <input
                                type="checkbox"
                                checked={!!editForm.deliveryInternational}
                                onChange={e => setEditForm({ ...editForm, deliveryInternational: e.target.checked })}
                                className="accent-green-600"
                            />
                            <span className="text-sm">International</span>
                        </label>
                    </div>
                    {editForm.origin === 'ABROAD' && (
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Within-state and nationwide delivery methods are disabled for products shipped from abroad.</p>
                    )}
                </div>
                {editForm.origin === 'LOCAL' && (
                    <label className="flex flex-col gap-1 text-xs sm:col-span-2">
                        <span className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={!!editForm.acceptCod}
                                onChange={e => setEditForm({ ...editForm, acceptCod: e.target.checked })}
                                className="accent-green-600" />
                            Accept Cash on Delivery (COD) for this product
                        </span>
                        <span className="text-slate-400 font-normal pl-6">If unchecked, buyers must pay online.</span>
                    </label>
                )}
                <label className="flex flex-col gap-1 text-xs">
                    SKU
                    <input type="text" value={editForm.sku ?? ''}
                        onChange={e => setEditForm({ ...editForm, sku: e.target.value })}
                        placeholder="e.g. ABC-001"
                        className="border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm bg-white dark:bg-slate-900" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                    Tags (comma-separated)
                    <input type="text" value={editForm.tags ?? ''}
                        onChange={e => setEditForm({ ...editForm, tags: e.target.value })}
                        placeholder="e.g. fashion, summer"
                        className="border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm bg-white dark:bg-slate-900" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                    Scheduled Publish
                    <input type="datetime-local" value={editForm.scheduledAt ?? ''}
                        onChange={e => setEditForm({ ...editForm, scheduledAt: e.target.value })}
                        className="border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm bg-white dark:bg-slate-900" />
                </label>
                <div className="flex flex-col gap-2 text-xs sm:col-span-2 lg:col-span-3">
                    <span className="font-medium text-slate-600 dark:text-slate-300">Product images (max 8)</span>
                    <p className="text-slate-400 text-[11px]">Remove photos with ×. Add more below — new uploads are appended until the limit.</p>
                    <div className="flex flex-wrap gap-2">
                        {editImageUrls.map((url) => (
                            <div key={url} className="relative h-16 w-16 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 group/img">
                                <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                                <button
                                    type="button"
                                    title="Remove image"
                                    onClick={() => setEditImageUrls((prev) => prev.filter((u) => u !== url))}
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/img:opacity-100 transition text-white text-xs font-semibold"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <label className="flex flex-col gap-1 cursor-pointer">
                        <span className="text-slate-500">Add images</span>
                        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={(e) => setNewImages(Array.from(e.target.files || []))}
                            className="text-xs border border-slate-200 dark:border-slate-700 rounded p-1.5 bg-white dark:bg-slate-900 file:mr-2" />
                        {newImages.length > 0 && (
                            <span className="text-blue-500">{newImages.length} new file(s) will upload on save</span>
                        )}
                    </label>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="grid gap-2 sm:grid-cols-2 w-full min-w-0">
                            <input value={newVariantGroupLabel}
                                onChange={e => setNewVariantGroupLabel(e.target.value)}
                                placeholder="New variant group label"
                                className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm outline-none" />
                            <select value={newVariantGroupType}
                                onChange={e => setNewVariantGroupType(e.target.value)}
                                className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm outline-none">
                                <option value="TEXT">Text</option>
                                <option value="IMAGE">Image</option>
                            </select>
                        </div>
                        <button type="button" onClick={addVariantGroup}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 transition">
                            <PlusIcon size={14} /> Add Group
                        </button>
                    </div>

                    {variantGroups.length > 0 ? variantGroups.map((group, gIdx) => (
                        <div key={gIdx} className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap gap-2 w-full min-w-0">
                                    <input value={group.label}
                                        onChange={e => setVariantGroups(prev => prev.map((item, i) => i === gIdx ? { ...item, label: e.target.value } : item))}
                                        className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 text-sm outline-none"
                                        placeholder="Group label" />
                                    <select value={group.type}
                                        onChange={e => setVariantGroups(prev => prev.map((item, i) => i === gIdx ? { ...item, type: e.target.value } : item))}
                                        className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 text-sm outline-none">
                                        <option value="TEXT">Text</option>
                                        <option value="IMAGE">Image</option>
                                    </select>
                                    <label className="flex items-center gap-2 text-xs text-slate-500">
                                        <input type="checkbox" checked={group.required}
                                            onChange={e => setVariantGroups(prev => prev.map((item, i) => i === gIdx ? { ...item, required: e.target.checked } : item))}
                                            className="accent-slate-700" />
                                        Required
                                    </label>
                                </div>
                                <button type="button" onClick={() => removeVariantGroup(gIdx)}
                                    className="text-red-500 text-xs hover:text-red-700 transition">Remove group</button>
                            </div>

                            <div className="mt-4 space-y-3">
                                {group.options.length > 0 ? (
                                    <div className="grid gap-3">
                                        {group.options.map((option, oIdx) => (
                                            <div key={oIdx} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Option {oIdx + 1}</span>
                                                    <button type="button" onClick={() => removeVariantOption(gIdx, oIdx)}
                                                        className="text-rose-500 text-xs hover:text-rose-700 transition">Remove</button>
                                                </div>
                                                <div className="grid gap-2 sm:grid-cols-2 w-full min-w-0">
                                                    <input value={option.label}
                                                        onChange={e => updateVariantOption(gIdx, oIdx, 'label', e.target.value)}
                                                        placeholder="Label"
                                                        className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm outline-none" />
                                                    {group.type === 'IMAGE' && (
                                                        <input value={option.image}
                                                            onChange={e => updateVariantOption(gIdx, oIdx, 'image', e.target.value)}
                                                            placeholder="Image URL"
                                                            className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm outline-none" />
                                                    )}
                                                    <input value={option.sku || ''}
                                                        onChange={e => updateVariantOption(gIdx, oIdx, 'sku', e.target.value)}
                                                        placeholder="SKU (optional)"
                                                        className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm outline-none" />
                                                    <div className="grid gap-2 sm:grid-cols-4 w-full min-w-0">
                                                        <input value={option.mrp || ''}
                                                            onChange={e => updateVariantOption(gIdx, oIdx, 'mrp', e.target.value)}
                                                            placeholder="MRP"
                                                            className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm outline-none" />
                                                        <input type="number" value={option.price || ''}
                                                            onChange={e => updateVariantOption(gIdx, oIdx, 'price', e.target.value)}
                                                            placeholder="Price"
                                                            className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm outline-none" />
                                                        <input type="number" value={option.quantity}
                                                            onChange={e => updateVariantOption(gIdx, oIdx, 'quantity', e.target.value)}
                                                            placeholder="Qty"
                                                            className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm outline-none" />
                                                        <label className="flex items-center gap-2 text-xs text-slate-500">
                                                            <input type="checkbox" checked={option.inStock}
                                                                onChange={e => updateVariantOption(gIdx, oIdx, 'inStock', e.target.checked)}
                                                                className="accent-slate-700" />
                                                            In stock
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500">No options added yet.</p>
                                )}

                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 w-full min-w-0">
                                    <input value={newVariantOptionInputs[gIdx]?.label || ''}
                                        onChange={e => setNewVariantOptionInputs(prev => ({ ...prev, [gIdx]: { ...prev[gIdx], label: e.target.value } }))}
                                        placeholder="Label"
                                        className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm outline-none" />
                                    {group.type === 'IMAGE' && (
                                        <input value={newVariantOptionInputs[gIdx]?.image || ''}
                                            onChange={e => setNewVariantOptionInputs(prev => ({ ...prev, [gIdx]: { ...prev[gIdx], image: e.target.value } }))}
                                            placeholder="Image URL"
                                            className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm outline-none" />
                                    )}
                                    <input value={newVariantOptionInputs[gIdx]?.mrp || ''}
                                        onChange={e => setNewVariantOptionInputs(prev => ({ ...prev, [gIdx]: { ...prev[gIdx], mrp: e.target.value } }))}
                                        placeholder="MRP"
                                        className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm outline-none" />
                                    <input type="number" value={newVariantOptionInputs[gIdx]?.price || ''}
                                        onChange={e => setNewVariantOptionInputs(prev => ({ ...prev, [gIdx]: { ...prev[gIdx], price: e.target.value } }))}
                                        placeholder="Price"
                                        className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm outline-none" />
                                    <input value={newVariantOptionInputs[gIdx]?.quantity || ''}
                                        onChange={e => setNewVariantOptionInputs(prev => ({ ...prev, [gIdx]: { ...prev[gIdx], quantity: e.target.value } }))}
                                        placeholder="Quantity"
                                        className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm outline-none" />
                                </div>
                                <button type="button" onClick={() => addVariantOption(gIdx)}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 transition">
                                    <PlusIcon size={14} /> Add Option
                                </button>
                            </div>
                        </div>
                    )) : (
                        <p className="text-xs text-slate-500">No product variant groups configured for this item.</p>
                    )}
                </div>
                <label className="flex flex-col gap-1 text-xs sm:col-span-2 lg:col-span-3">
                    Description
                    <textarea value={editForm.description} rows={3}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        className="border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm resize-none bg-white dark:bg-slate-900" />
                </label>
            </div>

            {/* ── Wholesale / Bulk Pricing ─────────────────────────────────── */}
            <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Wholesale / Bulk Pricing</p>
                    <p className="text-xs text-slate-400 mt-0.5">Quantity-based tiered prices. Buyers get cheaper unit prices the more they order.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input type="checkbox" checked={editIsWholesale}
                        onChange={e => setEditIsWholesale(e.target.checked)}
                        className="w-4 h-4 accent-slate-700 rounded" />
                    <span className="text-sm text-slate-700 dark:text-slate-200">Enable wholesale pricing</span>
                </label>
                {editIsWholesale && (
                    <div className="space-y-3">
                        {editWholesaleTiers.length > 0 && (
                            <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="text-left p-2 pl-3 font-medium">Min Qty</th>
                                            <th className="text-left p-2 font-medium">Max Qty</th>
                                            <th className="text-left p-2 font-medium">Unit Price ({currency})</th>
                                            <th className="w-8 p-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {editWholesaleTiers.map((tier, idx) => (
                                            <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
                                                <td className="p-2 pl-3 text-slate-700 dark:text-slate-200">{tier.minQty}</td>
                                                <td className="p-2 text-slate-700 dark:text-slate-200">
                                                    {tier.maxQty != null ? tier.maxQty : <span className="text-slate-400">∞</span>}
                                                </td>
                                                <td className="p-2 text-slate-700 dark:text-slate-200">{tier.price.toLocaleString()}</td>
                                                <td className="p-2 text-right">
                                                    <button type="button" onClick={() => removeEditWholesaleTier(idx)}
                                                        className="text-red-400 hover:text-red-600 transition">
                                                        <XIcon size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="flex gap-2 items-end flex-wrap">
                            <div className="w-20">
                                <label className="text-[10px] text-slate-400 mb-0.5 block">Min Qty</label>
                                <input type="number" min="1" value={editNewTier.minQty}
                                    onChange={e => setEditNewTier(p => ({ ...p, minQty: e.target.value }))}
                                    placeholder="1"
                                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none bg-white dark:bg-slate-900" />
                            </div>
                            <div className="w-24">
                                <label className="text-[10px] text-slate-400 mb-0.5 block">Max Qty <span className="text-slate-300">(∞ if blank)</span></label>
                                <input type="number" min="1" value={editNewTier.maxQty}
                                    onChange={e => setEditNewTier(p => ({ ...p, maxQty: e.target.value }))}
                                    placeholder="99"
                                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none bg-white dark:bg-slate-900" />
                            </div>
                            <div className="w-28">
                                <label className="text-[10px] text-slate-400 mb-0.5 block">Unit Price ({currency})</label>
                                <input type="number" min="0" step="0.01" value={editNewTier.price}
                                    onChange={e => setEditNewTier(p => ({ ...p, price: e.target.value }))}
                                    placeholder="8000"
                                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none bg-white dark:bg-slate-900" />
                            </div>
                            <button type="button" onClick={addEditWholesaleTier}
                                className="px-3 py-1.5 bg-slate-700 text-white rounded text-xs hover:bg-slate-800 transition flex items-center gap-1 shrink-0">
                                + Add Tier
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => saveEdit(product.id)} disabled={saving}
                    className="inline-flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2 rounded-full hover:bg-slate-900 transition text-sm disabled:opacity-50">
                    <CheckIcon size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={cancelEdit}
                    className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-full hover:bg-slate-200 transition text-sm">
                    <XIcon size={14} /> Cancel
                </button>
            </div>
        </div>
    )

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
    const requestAd = async (productId) => {
        setRequestingAd(productId)
        try {
            await axios.post(`/api/products/${productId}/request-ad`, {}, {
                headers: await getStoreAuthHeaders(getToken)
            })
            toast.success("Ad request submitted successfully!")
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        }
        setRequestingAd(null)
    }

    const handleCSVImport = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImporting(true)
        try {
            const formData = new FormData()
            formData.append("csv", file)
            const { data } = await axios.post("/api/store/product/bulk-import", formData, {
                headers: await getStoreAuthHeaders(getToken)
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
        const header = "name,description,mrp,price,category,quantity,sku,tags,image_url,origin,accept_cod,manufacturer,material,made_in,guarantee_period"
        const example = "Sample T-Shirt,A comfortable cotton t-shirt,5000,3500,Clothing,10,TSH-001,fashion|clothing,https://example.com/image.jpg,LOCAL,true,Nike,Cotton,Nigeria,1 year"
        const example2 = "Imported Sneakers,Premium sneakers from abroad,25000,19000,Clothing,5,SNK-001,shoes|imported,https://example.com/sneaker.jpg,ABROAD,,Adidas,Leather,China,6 months"
        const blob = new Blob([header + "\n" + example + "\n" + example2], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a"); a.href = url; a.download = "Shpinx-Bulk-Import-Template.csv"; a.click()
        URL.revokeObjectURL(url)
    }

    const fetchProducts = async () => {
        try {
            const { data } = await axios.get("/api/store/product", {
                headers: await getStoreAuthHeaders(getToken)
            })
            setProducts(data.products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    const addVariantGroup = () => {
        const label = newVariantGroupLabel.trim()
        if (!label) return toast.error("Enter a variant group name.")
        if (variantGroups.find(g => g.label.toLowerCase() === label.toLowerCase())) {
            return toast.error(`Variant group "${label}" already exists.`)
        }
        setVariantGroups(prev => [...prev, { label, type: newVariantGroupType, required: true, options: [] }])
        setNewVariantGroupLabel("")
        setNewVariantGroupType("TEXT")
    }

    const removeVariantGroup = (groupIdx) => {
        setVariantGroups(prev => prev.filter((_, i) => i !== groupIdx))
        setNewVariantOptionInputs(prev => {
            const next = { ...prev }
            delete next[groupIdx]
            return next
        })
    }

    const addVariantOption = (groupIdx) => {
        const input = newVariantOptionInputs[groupIdx] || {}
        const label = (input.label || "").trim()
        if (!label) return toast.error("Option label is required.")
        const group = variantGroups[groupIdx]
        if (!group) return
        if (group.options.find(o => o.label.toLowerCase() === label.toLowerCase())) {
            return toast.error(`Option "${label}" already exists in ${group.label}.`)
        }
        const price = parsePrice(input.price)
        const option = {
            label,
            image: input.image || "",
            sku: input.sku || "",
            mrp: input.mrp || "",
            price: price || 0,
            priceModifier: computeVariantPriceModifier(price, editForm.price),
            quantity: parseInt(input.quantity, 10) || 0,
            inStock: (parseInt(input.quantity, 10) || 0) > 0,
        }
        setVariantGroups(prev => prev.map((g, i) => i === groupIdx ? { ...g, options: [...g.options, option] } : g))
        setNewVariantOptionInputs(prev => ({ ...prev, [groupIdx]: { label: "", image: "", sku: "", mrp: "", price: "", quantity: "" } }))
    }

    const removeVariantOption = (groupIdx, optionIdx) => {
        setVariantGroups(prev => prev.map((g, i) => i === groupIdx ? { ...g, options: g.options.filter((_, j) => j !== optionIdx) } : g))
    }

    const updateVariantOption = (groupIdx, optionIdx, field, value) => {
        setVariantGroups(prev => prev.map((g, i) => i === groupIdx ? {
            ...g,
            options: g.options.map((opt, j) => {
                if (j !== optionIdx) return opt
                if (field === 'price') {
                    const price = parsePrice(value)
                    return {
                        ...opt,
                        price,
                        priceModifier: computeVariantPriceModifier(price, editForm.price),
                    }
                }
                return { ...opt, [field]: value }
            })
        } : g))
    }

    const toggleStock = async (productId) => {
        try {
            const { data } = await axios.post("/api/store/stock-toggle", { productId }, {
                headers: await getStoreAuthHeaders(getToken)
            })
            setProducts(products.map(p => p.id === productId ? { ...p, inStock: !p.inStock } : p))
            toast.success(data.message)
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        }
    }

    const toggleCod = async (productId) => {
        try {
            const { data } = await axios.post("/api/store/cod-toggle", { productId }, {
                headers: await getStoreAuthHeaders(getToken)
            })
            setProducts(products.map(p => p.id === productId ? { ...p, acceptCod: !p.acceptCod } : p))
            toast.success(data.message)
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        }
    }

    const openEdit = (product) => {
        setEditingProduct(product.id)
        setEditImageUrls(Array.isArray(product.images) ? [...product.images] : [])
        setEditForm({
            name: product.name,
            description: product.description,
            mrp: product.mrp,
            price: product.price,
            category: product.category,
            manufacturer: product.manufacturer ?? '',
            material: product.material ?? '',
            guaranteePeriod: product.guaranteePeriod ?? '',
            quantity: product.quantity ?? 0,
            sku: product.sku ?? '',
            tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
            scheduledAt: product.scheduledAt ? new Date(product.scheduledAt).toISOString().slice(0,16) : '',
            origin: product.origin ?? 'LOCAL',
            deliveryWithinState: product.deliveryWithinState !== false,
            deliveryNationwide: product.deliveryNationwide !== false,
            deliveryInternational: product.deliveryInternational === true,
            acceptCod: (product.origin ?? 'LOCAL') === 'ABROAD' ? false : product.acceptCod !== false,
        })
        const basePrice = parsePrice(product.price)
        setVariantGroups(Array.isArray(product.variantGroups) ? product.variantGroups.map(group => ({
            label: group.label,
            type: group.type,
            required: group.required,
            options: Array.isArray(group.options) ? group.options.map(option => ({
                label: option.label,
                image: option.image || "",
                sku: option.sku || "",
                mrp: option.mrp || "",
                price: basePrice + (option.priceModifier ?? 0),
                priceModifier: option.priceModifier ?? 0,
                quantity: option.quantity ?? 0,
                inStock: option.inStock,
            })) : [],
        })) : [])
        setNewImages([])
        setNewVariantGroupLabel("")
        setNewVariantGroupType("TEXT")
        setNewVariantOptionInputs({})
        // Wholesale
        setEditIsWholesale(product.isWholesale === true)
        setEditWholesaleTiers(
            Array.isArray(product.wholesaleTiers)
                ? product.wholesaleTiers.map(t => ({ minQty: t.minQty, maxQty: t.maxQty ?? null, price: t.price }))
                : []
        )
        setEditNewTier({ minQty: "", maxQty: "", price: "" })
    }

    const cancelEdit = () => {
        setEditingProduct(null)
        setEditForm({})
        setNewImages([])
        setEditImageUrls([])
        setVariantGroups([])
        setNewVariantGroupLabel("")
        setNewVariantGroupType("TEXT")
        setNewVariantOptionInputs({})
        setEditIsWholesale(false)
        setEditWholesaleTiers([])
        setEditNewTier({ minQty: "", maxQty: "", price: "" })
    }

    const addEditWholesaleTier = () => {
        const minQty = parseInt(editNewTier.minQty, 10)
        const maxQty = editNewTier.maxQty !== "" ? parseInt(editNewTier.maxQty, 10) : null
        const price = parseFloat(editNewTier.price)
        if (!minQty || minQty < 1) return toast.error("Min quantity must be at least 1.")
        if (maxQty !== null && maxQty <= minQty) return toast.error("Max quantity must be greater than min quantity.")
        if (!price || price <= 0) return toast.error("Price must be greater than 0.")
        const overlaps = editWholesaleTiers.some(t => {
            const tMax = t.maxQty ?? Infinity
            const nMax = maxQty ?? Infinity
            return minQty <= tMax && nMax >= t.minQty
        })
        if (overlaps) return toast.error("Quantity range overlaps with an existing tier.")
        setEditWholesaleTiers(prev =>
            [...prev, { minQty, maxQty, price }].sort((a, b) => a.minQty - b.minQty)
        )
        setEditNewTier({ minQty: "", maxQty: "", price: "" })
    }

    const removeEditWholesaleTier = (idx) =>
        setEditWholesaleTiers(prev => prev.filter((_, i) => i !== idx))

    const saveEdit = async (productId) => {
        if (editImageUrls.length + newImages.length === 0) {
            toast.error("Keep at least one image, or add new photos before saving.")
            return
        }
        if (editImageUrls.length + newImages.length > 8) {
            toast.error("Maximum 8 images per product. Remove some or upload fewer files.")
            return
        }
        setSaving(true)
        try {
            const formData = new FormData()
            formData.append("productId", productId)
            formData.append("name", editForm.name)
            formData.append("description", editForm.description)
            formData.append("mrp", editForm.mrp)
            formData.append("price", editForm.price)
            formData.append("category", editForm.category)
            formData.append("manufacturer", editForm.manufacturer || "")
            formData.append("material", editForm.material || "")
            formData.append("guaranteePeriod", editForm.guaranteePeriod || "")
            formData.append("quantity", editForm.quantity)
            formData.append("sku", editForm.sku || "")
            formData.append("tags", editForm.tags || "")
            formData.append("scheduledAt", editForm.scheduledAt || "")
            formData.append("origin", editForm.origin || "LOCAL")
            formData.append("acceptCod", editForm.origin === "LOCAL" ? (editForm.acceptCod ? "true" : "false") : "false")
            formData.append("deliveryWithinState", editForm.deliveryWithinState ? "true" : "false")
            formData.append("deliveryNationwide", editForm.deliveryNationwide ? "true" : "false")
            formData.append("deliveryInternational", editForm.deliveryInternational ? "true" : "false")
            formData.append("existingImages", JSON.stringify(editImageUrls))
            newImages.forEach(img => formData.append("images", img))
            formData.append("isWholesale", editIsWholesale ? "true" : "false")
            formData.append("wholesaleTiers", JSON.stringify(editWholesaleTiers))

            const { data } = await axios.patch("/api/store/product", formData, {
                headers: await getStoreAuthHeaders(getToken)
            })

            // Persist variant configuration after the product update.
            await axios.post("/api/store/product/variants", {
                productId,
                groups: variantGroups,
            }, {
                headers: await getStoreAuthHeaders(getToken)
            })

            toast.success(data.message)
            setProducts(products.map(p => p.id === productId ? {
                ...data.product,
                variantGroups,
                variants: variantGroups.flatMap(group => group.options || []),
            } : p))
            cancelEdit()
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        }
        setSaving(false)
    }

    const deleteProduct = async (productId) => {
        setDeletingId(productId)
        try {
            await axios.delete(`/api/store/product?productId=${productId}`, {
                headers: await getStoreAuthHeaders(getToken)
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
        <div className="text-slate-500 dark:text-slate-300 mb-28">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <h1 className="text-2xl">Manage <span className="text-slate-800 dark:text-slate-100 font-medium">Products</span></h1>
                <div className="flex items-center gap-2">
                    <button onClick={downloadCSVTemplate}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-300 hover:border-slate-400 transition">
                        <DownloadIcon size={13} /> CSV Template
                    </button>
                    <label className={`flex items-center gap-1.5 text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-300 hover:border-slate-400 transition cursor-pointer ${importing ? 'opacity-50' : ''}`}>
                        <UploadIcon size={13} /> {importing ? "Importing..." : "Import CSV"}
                        <input type="file" accept=".csv" hidden ref={csvRef} onChange={handleCSVImport} disabled={importing} />
                    </label>
                </div>
            </div>

            {products.length === 0 ? (
                <p className="text-slate-400">No products yet. Add your first product.</p>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => (
                        <div key={product.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex gap-4">
                                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
                                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="112px" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{product.name}</p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{product.category}</p>
                                        </div>
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${product.inStock ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {product.inStock ? 'In stock' : 'Out of stock'}
                                        </span>
                                    </div>
                                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-300">
                                        {product.description || 'No product description available.'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <div className="grid grid-cols-2 gap-3">
                                    <span className="font-medium text-slate-700 dark:text-slate-100">Price</span>
                                    <span className="text-right font-semibold text-slate-900 dark:text-slate-100">{currency}{product.price.toLocaleString()}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <span className="font-medium text-slate-700 dark:text-slate-100">MRP</span>
                                    <span className="text-right text-slate-500 line-through dark:text-slate-400">{currency}{product.mrp.toLocaleString()}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <span className="font-medium text-slate-700 dark:text-slate-100">Qty</span>
                                    <span className="text-right">{product.quantity ?? 0}</span>
                                </div>
                                {typeof product._count?.orderItems === 'number' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <span className="font-medium text-slate-700 dark:text-slate-100">Orders</span>
                                        <span className="text-right">{product._count.orderItems}</span>
                                    </div>
                                )}
                                {product.quantity !== undefined && product.quantity <= 5 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <span className="font-medium text-slate-700 dark:text-slate-100">Stock alert</span>
                                        <span className="text-right text-amber-700 dark:text-amber-300">Low stock ({product.quantity} left)</span>
                                    </div>
                                )}
                                {product.sku && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <span className="font-medium text-slate-700 dark:text-slate-100">SKU</span>
                                        <span className="text-right text-slate-500 dark:text-slate-400">{product.sku}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button onClick={() => toggleStock(product.id)}
                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                                        product.inStock 
                                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300' 
                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                                    }`}>
                                    {product.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                                </button>
                                {product.origin === 'LOCAL' && (
                                    <button onClick={() => toggleCod(product.id)}
                                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                                            product.acceptCod 
                                                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300' 
                                                : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'
                                        }`}>
                                        {product.acceptCod ? 'COD Enabled' : 'COD Disabled'}
                                    </button>
                                )}
                                <button onClick={() => openEdit(product)}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    <PencilIcon size={15} /> Edit
                                </button>
                                <button onClick={() => cloneProduct(product.id)} disabled={cloning === product.id}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-400">
                                    <CopyIcon size={15} /> Clone
                                </button>
                                <button onClick={() => setConfirmDeleteId(product.id)}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 transition dark:border-slate-700 dark:bg-slate-900 dark:text-rose-400">
                                    <Trash2Icon size={15} /> Delete
                                </button>
                                <button onClick={() => requestAd(product.id)} disabled={requestingAd === product.id}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400">
                                    {requestingAd === product.id ? "Requesting..." : "Request Ad"}
                                </button>
                            </div>

                            {editingProduct === product.id && (
                                <div className="lg:hidden">
                                    {renderEditForm(product)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {currentEditingProduct && (
                <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center bg-black/40 p-6">
                    <div className="max-w-6xl w-full max-h-[calc(100vh-4rem)] overflow-y-auto">
                        {renderEditForm(currentEditingProduct)}
                    </div>
                </div>
            )}

            {confirmDeleteId && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Delete Product?</h3>
                        <p className="text-slate-500 dark:text-slate-300 text-sm mb-6">
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
                                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2 rounded hover:bg-slate-200 transition text-sm">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
