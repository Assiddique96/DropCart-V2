'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import Image from "next/image"
import { SaveIcon, UploadIcon } from "lucide-react"
import { assets } from "@/assets/assets"

export default function StoreProfile() {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [store, setStore] = useState(null)
    const [form, setForm] = useState({
        name: '', description: '', email: '', contact: '', address: ''
    })
    const [newLogo, setNewLogo] = useState(null)
    const [newBanner, setNewBanner] = useState(null)

    const fetchProfile = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get("/api/store/profile", {
                headers: { Authorization: `Bearer ${token}` }
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
            })
        } catch (e) {
            toast.error(e?.response?.data?.error || e.message)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const token = await getToken()
            const formData = new FormData()
            Object.entries(form).forEach(([k, v]) => formData.append(k, v))
            if (newLogo) formData.append("logo", newLogo)
            if (newBanner) formData.append("banner", newBanner)

            const { data } = await axios.patch("/api/store/profile", formData, {
                headers: { Authorization: `Bearer ${token}` }
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

    if (loading) return <Loading />

    const logoPreview = newLogo ? URL.createObjectURL(newLogo) : store?.logo
    const bannerPreview = newBanner ? URL.createObjectURL(newBanner) : store?.banner

    return (
        <div className="text-slate-500 mb-28 max-w-2xl">
            <h1 className="text-2xl mb-1">Store <span className="text-slate-800 font-medium">Profile</span></h1>
            <p className="text-xs text-slate-400 mb-8">
                Username <span className="font-mono text-slate-600">@{store?.username}</span> cannot be changed after approval.
            </p>

            {/* Banner */}
            <div className="mb-6">
                <p className="text-xs text-slate-500 mb-2">Store Banner <span className="text-slate-300">(optional, displays on your shop page)</span></p>
                <label className="cursor-pointer block">
                    <div className={`relative w-full h-32 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 hover:border-slate-400 transition`}>
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
                <p className="text-xs text-slate-500 mb-2">Store Logo</p>
                <label className="cursor-pointer inline-block">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 hover:border-slate-400 transition">
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
                        <label className="text-xs text-slate-500 mb-1 block">{label}</label>
                        <input
                            type={type}
                            value={form[key]}
                            onChange={e => setForm({ ...form, [key]: e.target.value })}
                            placeholder={placeholder}
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-slate-400 transition"
                        />
                    </div>
                ))}

                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Description</label>
                    <textarea
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        rows={4}
                        placeholder="Tell buyers about your store..."
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none resize-none focus:border-slate-400 transition"
                    />
                </div>

                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Address</label>
                    <textarea
                        value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        rows={2}
                        placeholder="Store physical address"
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none resize-none focus:border-slate-400 transition"
                    />
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
