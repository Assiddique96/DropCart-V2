'use client'
import { assets } from "@/assets/assets"
import { useAuth } from "@clerk/nextjs"
import Image from "next/image"
import { useState, useRef } from "react"
import { toast } from "react-hot-toast"
import axios from "axios"
import { XIcon, PlusIcon, SparklesIcon, UploadIcon, ImageIcon, TypeIcon, ChevronDownIcon } from "lucide-react"
import { getStoreAuthHeaders } from "@/lib/storeAuthHeaders"

const categories = [
    'Electronics', 'Clothing', 'Home & Garden', 'Beauty & Health',
    'Toys & Games', 'Sports & Outdoors', 'Books & Media',
    'Food & Beverage', 'Hobbies & Crafts', 'Automotive',
    'Baby & Kids', 'Pet Supplies', 'Office Supplies', 'Industrial & Scientific', 'Others'
]

const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
    'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
    'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
    'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
    'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
    'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
    'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
    'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos',
    'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
    'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
    'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
    'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau',
    'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
    'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia',
    'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
    'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
    'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
    'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen', 'Zambia', 'Zimbabwe'
]

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
    'Others': ['Generic', 'Unknown', 'Various', 'Others']
}
const MAX_IMAGES = 8

export default function StoreAddProduct() {
    const { getToken } = useAuth()
    const [images, setImages] = useState([]) // array of File objects, max 8
    const [loading, setLoading] = useState(false)
    const [aiUsed, setAiUsed] = useState(false)
    const [tagInput, setTagInput] = useState("")
    const fileInputRef = useRef()

    const [productInfo, setProductInfo] = useState({
        name: "", description: "", mrp: "", price: "",
        category: "", sku: "", quantity: "", scheduledAt: "", tags: [], origin: "LOCAL", madeIn: "", manufacturer: "",
        acceptCod: true,
    })

    // Variant builder state — fully customizable groups
    const [variantGroups, setVariantGroups] = useState([])
    // Each group: { label, type: "TEXT"|"IMAGE", required, options: [{ label, image, priceModifier, quantity }] }
    const [newGroupLabel, setNewGroupLabel] = useState("")
    const [newGroupType, setNewGroupType] = useState("TEXT")
    const [newOptionInputs, setNewOptionInputs] = useState({}) // { [groupIdx]: { label, image, priceModifier, quantity } }

    const onChange = (e) => setProductInfo(p => ({ ...p, [e.target.name]: e.target.value }))

    const addImages = (files) => {
        const newFiles = Array.from(files).slice(0, MAX_IMAGES - images.length)
        setImages(prev => [...prev, ...newFiles])
    }

    const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx))

    const addTag = () => {
        const tag = tagInput.trim()
        if (tag && !productInfo.tags.includes(tag) && productInfo.tags.length < 10) {
            setProductInfo(p => ({ ...p, tags: [...p.tags, tag] }))
            setTagInput("")
        }
    }

    const removeTag = (tag) => setProductInfo(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))

    const addVariantGroup = () => {
        const label = newGroupLabel.trim()
        if (!label) return toast.error("Enter a variant group name (e.g. Color, Storage, Model).")
        if (variantGroups.find(g => g.label.toLowerCase() === label.toLowerCase())) {
            return toast.error(`Group "${label}" already exists.`)
        }
        setVariantGroups(prev => [...prev, { label, type: newGroupType, required: true, options: [] }])
        setNewGroupLabel(""); setNewGroupType("TEXT")
    }

    const removeVariantGroup = (idx) => {
        setVariantGroups(prev => prev.filter((_, i) => i !== idx))
        setNewOptionInputs(prev => { const n = {...prev}; delete n[idx]; return n; })
    }

    const addOptionToGroup = (groupIdx) => {
        const input = newOptionInputs[groupIdx] || {}
        const label = (input.label || "").trim()
        if (!label) return toast.error("Option label is required.")
        const group = variantGroups[groupIdx]
        if (group.options.find(o => o.label.toLowerCase() === label.toLowerCase())) {
            return toast.error(`Option "${label}" already in ${group.label}.`)
        }
        const newOption = {
            label,
            image: input.image || null,
            priceModifier: parseFloat(input.priceModifier) || 0,
            quantity: parseInt(input.quantity) || 0,
        }
        setVariantGroups(prev => prev.map((g, i) =>
            i === groupIdx ? { ...g, options: [...g.options, newOption] } : g
        ))
        setNewOptionInputs(prev => ({ ...prev, [groupIdx]: { label: "", image: "", priceModifier: "", quantity: "" } }))
    }

    const removeOptionFromGroup = (groupIdx, optIdx) => {
        setVariantGroups(prev => prev.map((g, i) =>
            i === groupIdx ? { ...g, options: g.options.filter((_, j) => j !== optIdx) } : g
        ))
    }

    const updateGroupOption = (groupIdx, optIdx, field, value) => {
        setVariantGroups(prev => prev.map((g, i) =>
            i === groupIdx ? {
                ...g,
                options: g.options.map((o, j) => j === optIdx ? { ...o, [field]: value } : o)
            } : g
        ))
    }

    const totalOptionCombinations = variantGroups.reduce((acc, g) => acc * Math.max(1, g.options.length), 1)

    // AI fill on first image upload
    const triggerAI = async (file) => {
        if (aiUsed) return
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onloadend = async () => {
            const base64String = reader.result.split(",")[1]
            const mimeType = file.type
            try {
                await toast.promise(
                    axios.post('/api/store/ai', { base64Image: base64String, mimeType }, {
                        headers: await getStoreAuthHeaders(getToken)
                    }),
                    {
                        loading: "Analysing image with AI...",
                        success: (res) => {
                            const data = res.data
                            if (data.name && data.description) {
                                setProductInfo(p => ({ ...p, name: data.name, description: data.description }))
                                setAiUsed(true)
                                return "AI filled product info 🚀"
                            }
                            return "AI could not analyse the image"
                        },
                        error: (err) => err?.response?.data?.error || err.message
                    }
                )
            } catch {}
        }
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        if (images.length === 0) return toast.error("Upload at least one product image.")
        setLoading(true)
        try {
            const formData = new FormData()
            Object.entries(productInfo).forEach(([k, v]) => {
                if (k === "tags") formData.append("tags", v.join(","))
                else if (k === "acceptCod") formData.append("acceptCod", v ? "true" : "false")
                else formData.append(k, v)
            })
            images.forEach(img => formData.append("images", img))

            const { data } = await axios.post("/api/store/product", formData, {
                headers: await getStoreAuthHeaders(getToken)
            })
            toast.success(data.message)

            // Save variant groups if defined
            if (variantGroups.length > 0 && data.productId) {
                await axios.post("/api/store/product/variants",
                    { productId: data.productId, groups: variantGroups },
                    { headers: await getStoreAuthHeaders(getToken) }
                )
            }

            // Reset form
            setProductInfo({ name: "", description: "", mrp: "", price: "", category: "", sku: "", quantity: "", scheduledAt: "", tags: [], origin: "LOCAL", madeIn: "", manufacturer: "", acceptCod: true })
            setImages([]); setAiUsed(false); setVariantGroups([]); setNewOptionInputs({})
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="text-slate-500 dark:text-slate-300 mb-28 max-w-2xl">
            <h1 className="text-2xl mb-6">Add New <span className="text-slate-800 dark:text-slate-100 font-medium">Product</span></h1>

            {/* Images */}
            <div className="mb-6">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Product Images <span className="text-slate-400 text-xs">({images.length}/{MAX_IMAGES})</span></p>
                <div className="flex flex-wrap gap-3">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative group">
                            <Image src={URL.createObjectURL(img)} width={80} height={80}
                                className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700" alt="" />
                            <button type="button" onClick={() => removeImage(idx)}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                                <XIcon size={10} />
                            </button>
                            {idx === 0 && <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-slate-800/60 text-white rounded-b-lg">Main</span>}
                        </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                        <label className="h-20 w-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-slate-500 transition text-slate-400">
                            <UploadIcon size={18} />
                            <span className="text-xs mt-1">Add</span>
                            <input type="file" accept="image/*" multiple hidden ref={fileInputRef}
                                onChange={e => {
                                    const files = e.target.files
                                    addImages(files)
                                    if (images.length === 0 && files[0]) triggerAI(files[0])
                                }} />
                        </label>
                    )}
                </div>
                <p className="text-xs text-slate-400 mt-1">First image is the main product image. Max {MAX_IMAGES} images. AI auto-fills name & description from first image.</p>
            </div>

            {/* Name */}
            <div className="mb-4">
                <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Product Name *</label>
                <input type="text" name="name" value={productInfo.name} onChange={onChange}
                    placeholder="Enter product name" required
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm focus:border-slate-400 transition" />
            </div>

            {/* Description */}
            <div className="mb-4">
                <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Description *</label>
                <textarea name="description" value={productInfo.description} onChange={onChange}
                    placeholder="Describe your product" rows={4} required
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm resize-none focus:border-slate-400 transition" />
            </div>

            {/* Prices + Qty */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                    <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">MRP *</label>
                    <input type="number" name="mrp" value={productInfo.mrp} onChange={onChange}
                        placeholder="0" min="0" step="0.01" required
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm" />
                </div>
                <div>
                    <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Offer Price *</label>
                    <input type="number" name="price" value={productInfo.price} onChange={onChange}
                        placeholder="0" min="0" step="0.01" required
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm" />
                </div>
                <div>
                    <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Stock Qty</label>
                    <input type="number" name="quantity" value={productInfo.quantity} onChange={onChange}
                        placeholder="0" min="0"
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm" />
                </div>
            </div>

            {/* Category + Manufacturer + SKU */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                    <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Category *</label>
                    <select name="category" value={productInfo.category}
                        onChange={e => setProductInfo(p => ({ ...p, category: e.target.value, manufacturer: "" }))} required
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm">
                        <option value="">Select category</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Manufacturer</label>
                    <select name="manufacturer" value={productInfo.manufacturer}
                        onChange={onChange}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm">
                        <option value="">Select manufacturer</option>
                        {productInfo.category && manufacturers[productInfo.category]?.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">SKU / Barcode</label>
                    <input type="text" name="sku" value={productInfo.sku} onChange={onChange}
                        placeholder="e.g. ABC-001"
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm" />
                </div>
            </div>

            <div className="mb-4">
                <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">MADE IN ...</label>
                <select
                    name="madeIn"
                    value={productInfo.madeIn}
                    onChange={onChange}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm"
                >
                    <option value="">Select country</option>
                    {countries.map(country => <option key={country} value={country}>{country}</option>)}
                </select>
            </div>

            {/* Schedule publish */}
            <div className="mb-4">
                <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Schedule Publish Date <span className="text-slate-300">(leave blank to publish immediately)</span></label>
                <input type="datetime-local" name="scheduledAt" value={productInfo.scheduledAt} onChange={onChange}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm" />
            </div>

            {/* Origin */}
            <div className="mb-6">
                <p className="text-xs text-slate-500 dark:text-slate-300 mb-2 font-medium">Shipping Origin *</p>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { value: 'LOCAL',  label: 'Local Product',       icon: '🏠', desc: 'Ships domestically',   eta: 'Delivery: 7 – 10 days',  cod: 'COD available',       color: 'border-green-400 bg-green-50', badge: 'text-green-700 bg-green-100' },
                        { value: 'ABROAD', label: 'Shipped from Abroad', icon: '✈️', desc: 'Ships internationally', eta: 'Delivery: 20 – 25 days', cod: 'Online payment only', color: 'border-blue-400 bg-blue-50',  badge: 'text-blue-700 bg-blue-100'  },
                    ].map(opt => (
                        <label key={opt.value}
                            className={`flex flex-col gap-1 border-2 rounded-xl p-4 cursor-pointer transition ${productInfo.origin === opt.value ? opt.color : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                            <input type="radio" name="origin" value={opt.value} checked={productInfo.origin === opt.value}
                                onChange={() => setProductInfo(p => ({
                                    ...p,
                                    origin: opt.value,
                                    acceptCod: opt.value === 'LOCAL' ? true : false,
                                }))} className="sr-only" />
                            <span className="text-xl">{opt.icon}</span>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{opt.label}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-300">{opt.desc}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-300">{opt.eta}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit mt-1 ${opt.badge}`}>{opt.cod}</span>
                        </label>
                    ))}
                </div>
                {productInfo.origin === 'LOCAL' && (
                    <label className="mt-4 flex items-start gap-3 cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 hover:border-slate-300 transition">
                        <input
                            type="checkbox"
                            checked={productInfo.acceptCod}
                            onChange={e => setProductInfo(p => ({ ...p, acceptCod: e.target.checked }))}
                            className="mt-0.5 accent-green-600"
                        />
                        <div>
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Accept Cash on Delivery (COD)</span>
                            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                                Buyers can pay when the order arrives. Turn off if you only want online payment for this product.
                            </p>
                        </div>
                    </label>
                )}
            </div>

            <div className="mb-6">
                <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Tags <span className="text-slate-300">(up to 10)</span></label>
                <div className="flex gap-2">
                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                        placeholder="Type a tag and press Enter"
                        className="flex-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm" />
                    <button type="button" onClick={addTag}
                        className="px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-300 hover:border-slate-400 transition">
                        <PlusIcon size={15} />
                    </button>
                </div>
                {productInfo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {productInfo.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                                {tag}
                                <XIcon size={10} className="cursor-pointer hover:text-red-500" onClick={() => removeTag(tag)} />
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Variants */}
            <div className="mb-6 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
                <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Product Variants</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Add customisable options — Color, Storage, Model, Bundle, Size, or anything else.
                        Use <strong>Image</strong> type for swatches with photos.
                    </p>
                </div>

                {/* Add a new group */}
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <label className="text-xs text-slate-400 mb-1 block">Group name</label>
                        <input value={newGroupLabel} onChange={e => setNewGroupLabel(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addVariantGroup())}
                            placeholder="e.g. Color, Storage, Model, Bundle..."
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-slate-400 transition" />
                    </div>
                    <div className="shrink-0">
                        <label className="text-xs text-slate-400 mb-1 block">Type</label>
                        <select value={newGroupType} onChange={e => setNewGroupType(e.target.value)}
                            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none bg-white dark:bg-slate-900">
                            <option value="TEXT">📝 Text pills</option>
                            <option value="IMAGE">🖼️ Image swatches</option>
                        </select>
                    </div>
                    <button type="button" onClick={addVariantGroup}
                        className="shrink-0 px-3 py-2 bg-slate-700 text-white rounded-lg text-xs hover:bg-slate-800 transition flex items-center gap-1">
                        <PlusIcon size={12} /> Add Group
                    </button>
                </div>

                {/* Existing groups */}
                {variantGroups.map((group, gIdx) => (
                    <div key={gIdx} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                        {/* Group header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{group.label}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${group.type === "IMAGE" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                                    {group.type === "IMAGE" ? "🖼️ Image" : "📝 Text"}
                                </span>
                                <label className="flex items-center gap-1 text-xs text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={group.required} onChange={e =>
                                        setVariantGroups(prev => prev.map((g, i) => i === gIdx ? { ...g, required: e.target.checked } : g))
                                    } className="accent-slate-700" />
                                    Required
                                </label>
                            </div>
                            <button type="button" onClick={() => removeVariantGroup(gIdx)}
                                className="text-red-400 hover:text-red-600 transition text-xs flex items-center gap-1">
                                <XIcon size={12} /> Remove group
                            </button>
                        </div>

                        {/* Existing options */}
                        {group.options.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {group.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs group/opt">
                                        {group.type === "IMAGE" && opt.image && (
                                            <img src={opt.image} alt="" className="w-6 h-6 rounded object-cover border border-slate-200 dark:border-slate-700" />
                                        )}
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-200">{opt.label}</p>
                                            {opt.priceModifier !== 0 && (
                                                <p className="text-[10px] text-green-600">
                                                    {opt.priceModifier > 0 ? "+" : ""}{opt.priceModifier.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        <button type="button" onClick={() => removeOptionFromGroup(gIdx, oIdx)}
                                            className="ml-1 text-slate-300 hover:text-red-500 transition opacity-0 group-hover/opt:opacity-100">
                                            <XIcon size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add option row */}
                        <div className="flex gap-2 items-end flex-wrap">
                            <div className="flex-1 min-w-28">
                                <label className="text-[10px] text-slate-400 mb-0.5 block">
                                    {group.type === "IMAGE" ? "Label (shown on hover)" : "Option label"}
                                </label>
                                <input
                                    value={newOptionInputs[gIdx]?.label || ""}
                                    onChange={e => setNewOptionInputs(p => ({ ...p, [gIdx]: { ...p[gIdx], label: e.target.value } }))}
                                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addOptionToGroup(gIdx))}
                                    placeholder={group.type === "IMAGE" ? "e.g. Midnight Black" : "e.g. 256 GB"}
                                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none bg-white dark:bg-slate-900" />
                            </div>

                            {group.type === "IMAGE" && (
                                <div className="flex-1 min-w-36">
                                    <label className="text-[10px] text-slate-400 mb-0.5 block">Image URL</label>
                                    <input
                                        value={newOptionInputs[gIdx]?.image || ""}
                                        onChange={e => setNewOptionInputs(p => ({ ...p, [gIdx]: { ...p[gIdx], image: e.target.value } }))}
                                        placeholder="https://..."
                                        className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none bg-white dark:bg-slate-900" />
                                </div>
                            )}

                            <div className="w-24">
                                <label className="text-[10px] text-slate-400 mb-0.5 block">Price +/−</label>
                                <input
                                    type="number"
                                    value={newOptionInputs[gIdx]?.priceModifier || ""}
                                    onChange={e => setNewOptionInputs(p => ({ ...p, [gIdx]: { ...p[gIdx], priceModifier: e.target.value } }))}
                                    placeholder="0"
                                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none bg-white dark:bg-slate-900" />
                            </div>

                            <div className="w-20">
                                <label className="text-[10px] text-slate-400 mb-0.5 block">Stock</label>
                                <input
                                    type="number"
                                    value={newOptionInputs[gIdx]?.quantity || ""}
                                    onChange={e => setNewOptionInputs(p => ({ ...p, [gIdx]: { ...p[gIdx], quantity: e.target.value } }))}
                                    placeholder="0"
                                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none bg-white dark:bg-slate-900" />
                            </div>

                            <button type="button" onClick={() => addOptionToGroup(gIdx)}
                                className="px-2.5 py-1.5 bg-slate-600 text-white rounded text-xs hover:bg-slate-700 transition flex items-center gap-1">
                                <PlusIcon size={11} /> Add
                            </button>
                        </div>
                    </div>
                ))}

                {variantGroups.length > 0 && variantGroups.every(g => g.options.length > 0) && (
                    <p className="text-xs text-slate-400">
                        {totalOptionCombinations} possible combination{totalOptionCombinations !== 1 ? "s" : ""}.
                        Buyers select one option per required group before adding to cart.
                    </p>
                )}
            </div>

            <button type="submit" disabled={loading}
                className="flex items-center gap-2 bg-slate-800 text-white px-8 py-2.5 rounded-lg hover:bg-slate-900 transition text-sm disabled:opacity-50">
                {loading ? "Adding..." : "Add Product"}
            </button>
        </form>
    )
}
