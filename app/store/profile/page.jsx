'use client'
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import Image from "next/image"
import { SaveIcon, UploadIcon, X } from "lucide-react"
//import { assets } from "@/assets/assets"
import { getStoreAuthHeaders } from "@/lib/storeAuthHeaders"

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT Abuja",
]

export default function StoreProfile() {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [store, setStore] = useState(null)
    const [form, setForm] = useState({
        name: '', description: '', email: '', contact: '', address: '',
        street: '', city: '', state: '', zip: '', country: 'Nigeria', deliveryStates: []
    })
    const [newLogo, setNewLogo] = useState(null)
    const [newBanner, setNewBanner] = useState(null)
    const [deliveryDropdownOpen, setDeliveryDropdownOpen] = useState(false)
    const deliveryDropdownRef = useRef(null)

    const fetchProfile = async () => {
        try {
            const { data } = await axios.get("/api/store/profile", {
                headers: await getStoreAuthHeaders(getToken)
            })
            setStore(data.store)
            setForm({
                name: data.store.name,
                description: data.store.description,
                email: data.store.email,
                contact: data.store.contact,
                address: data.store.address,
                street: data.store.street || '',
                city: data.store.city || '',
                state: data.store.state || '',
                zip: data.store.zip || '',
                country: data.store.country || 'Nigeria',
                deliveryStates: data.store.deliveryStates || [],
            })
        } catch (e) {
            toast.error(e?.response?.data?.error || e.message)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const formData = new FormData()
            Object.entries(form).forEach(([k, v]) => {
                if (k === "deliveryStates") return
                formData.append(k, v)
            })
            if (Array.isArray(form.deliveryStates) && form.deliveryStates.length > 0) {
                form.deliveryStates.forEach((state) => formData.append("deliveryStates", state))
            } else {
                formData.append("deliveryStates", "")
            }
            if (newLogo) formData.append("logo", newLogo)
            if (newBanner) formData.append("banner", newBanner)

            const { data } = await axios.patch("/api/store/profile", formData, {
                headers: await getStoreAuthHeaders(getToken)
            })
            toast.success(data.message)
            setStore(data.store)
            setNewLogo(null)
            setNewBanner(null)
        } catch (e) {
            toast.error(e?.response?.data?.error || e.message)
        }
        setSaving(false)
    }

    useEffect(() => { fetchProfile() }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (deliveryDropdownRef.current && !deliveryDropdownRef.current.contains(event.target)) {
                setDeliveryDropdownOpen(false)
            }
        }

        window.addEventListener("mousedown", handleClickOutside)
        return () => window.removeEventListener("mousedown", handleClickOutside)
    }, [])

    if (loading) return <Loading />

    const logoPreview = newLogo ? URL.createObjectURL(newLogo) : store?.logo
    const bannerPreview = newBanner ? URL.createObjectURL(newBanner) : store?.banner

    return (
        <div className="text-slate-500 dark:text-slate-300 mb-28 max-w-2xl">
            <h1 className="text-2xl mb-1">Store <span className="text-slate-800 dark:text-slate-100 font-medium">Profile</span></h1>
            <p className="text-xs text-slate-400 mb-8">
                Username <span className="font-mono text-slate-600 dark:text-slate-300">@{store?.username}</span> cannot be changed after approval.
            </p>

            {/* Banner */}
            <div className="mb-6">
                <p className="text-xs text-slate-500 dark:text-slate-300 mb-2">Store Banner <span className="text-slate-300">(optional, displays on your shop page)</span></p>
                <label className="cursor-pointer block">
                    <div className={`relative w-full h-32 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-900 hover:border-slate-400 transition`}>
                        {bannerPreview ? (
                            <Image src={bannerPreview} alt="banner" fill className="object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-300">
                                <UploadIcon size={24} />
                                <span className="text-xs">Upload banner image</span>
                            </div>
                        )}
                    </div>
                    <input type="file" accept="image/*" hidden onChange={e => setNewBanner(e.target.files[0])} />
                </label>
            </div>

            {/* Logo */}
            <div className="mb-6">
                <p className="text-xs text-slate-500 dark:text-slate-300 mb-2">Store Logo</p>
                <label className="cursor-pointer inline-block">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 transition">
                        <Image src={logoPreview || assets.upload_area} alt="logo" fill className="object-cover" />
                    </div>
                    <input type="file" accept="image/*" hidden onChange={e => setNewLogo(e.target.files[0])} />
                </label>
                {newLogo && <p className="text-xs text-green-600 mt-1">New logo selected</p>}
            </div>

            {/* Text fields */}
            <div className="space-y-4">
                {[
                    { label: "Store Name", key: "name", type: "text", placeholder: "Your store name" },
                    { label: "Email", key: "email", type: "email", placeholder: "store@email.com" },
                    { label: "Contact Number", key: "contact", type: "text", placeholder: "+234..." },
                ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                        <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">{label}</label>
                        <input
                            type={type}
                            value={form[key]}
                            onChange={e => setForm({ ...form, [key]: e.target.value })}
                            placeholder={placeholder}
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-slate-400 transition"
                        />
                    </div>
                ))}

                <div>
                    <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Description</label>
                    <textarea
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        rows={4}
                        placeholder="Tell buyers about your store..."
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none resize-none focus:border-slate-400 transition"
                    />
                </div>

                <div>
                    <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Address</label>
                    <textarea
                        value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        rows={2}
                        placeholder="Store physical address"
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none resize-none focus:border-slate-400 transition"
                    />
                </div>

                <div ref={deliveryDropdownRef} className="relative">
                    <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Delivery States</label>
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => setDeliveryDropdownOpen((open) => !open)}
                            className="w-full flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-sm text-left outline-none focus:border-slate-400 transition"
                        >
                            <span>{form.deliveryStates.length ? `${form.deliveryStates.length} selected` : "Select delivery states"}</span>
                            <span className="text-slate-400">▾</span>
                        </button>

                        {form.deliveryStates.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {form.deliveryStates.map((stateName) => (
                                    <span
                                        key={stateName}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        <span>{stateName}</span>
                                        <button
                                            type="button"
                                            onClick={() => setForm({
                                                ...form,
                                                deliveryStates: form.deliveryStates.filter((item) => item !== stateName),
                                            })}
                                            className="rounded-full p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {deliveryDropdownOpen && (
                        <div className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                            {NIGERIAN_STATES.filter((stateName) => !form.deliveryStates.includes(stateName)).map((stateName) => (
                                <button
                                    key={stateName}
                                    type="button"
                                    onClick={() => setForm({
                                        ...form,
                                        deliveryStates: [...form.deliveryStates, stateName],
                                    })}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    {stateName}
                                </button>
                            ))}
                            {form.deliveryStates.length === NIGERIAN_STATES.length && (
                                <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                                    All delivery states are selected.
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-xs text-slate-400 mt-1">
                        Choose states where you offer within-state delivery. Selected states appear above and can be removed.
                    </p>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 mt-8 px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition text-sm disabled:opacity-50"
            >
                <SaveIcon size={15} /> {saving ? "Saving..." : "Save Profile"}
            </button>
        </div>
    )
}
