'use client'
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { PlusIcon, SaveIcon, Trash2Icon, UploadIcon } from "lucide-react"

const emptyFeatured = () => ({
    image: "",
    badgeLabel: "",
    badgeText: "",
    title: "",
    line1: "",
    line2: "",
    priceLabel: "",
    price: "",
    cta: "",
    href: "/shop",
})

const emptyPromo = () => ({
    image: "",
    title: "",
    subtitle: "",
    href: "/shop",
    variant: "light",
})

export default function AdminHomePage() {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [featured, setFeatured] = useState([])
    const [promo1, setPromo1] = useState([])
    const [promo2, setPromo2] = useState([])

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const { data } = await axios.get("/api/admin/home-page", {
                    headers: { Authorization: `Bearer ${token}` },
                })
                setFeatured(data.featured?.length ? data.featured : [])
                setPromo1(data.promo1?.length ? data.promo1 : [])
                setPromo2(data.promo2?.length ? data.promo2 : [])
            } catch (e) {
                toast.error(e?.response?.data?.error || e.message)
            }
            setLoading(false)
        })()
    }, [getToken])

    const save = async () => {
        setSaving(true)
        try {
            const token = await getToken()
            const { data } = await axios.put(
                "/api/admin/home-page",
                { featured, promo1, promo2 },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            toast.success(
                `Saved: ${data.featured?.length ?? 0} featured, ${data.promo1?.length ?? 0} + ${data.promo2?.length ?? 0} promo slides.`
            )
        } catch (e) {
            toast.error(e?.response?.data?.error || e.message)
        }
        setSaving(false)
    }

    const resetToBuiltIn = async () => {
        if (!confirm("Clear all custom slides? The storefront will use built-in default banners until you add new slides.")) return
        setFeatured([])
        setPromo1([])
        setPromo2([])
        setSaving(true)
        try {
            const token = await getToken()
            await axios.put(
                "/api/admin/home-page",
                { featured: [], promo1: [], promo2: [] },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            toast.success("Cleared. Home page is using default banners.")
        } catch (e) {
            toast.error(e?.response?.data?.error || e.message)
        }
        setSaving(false)
    }

    if (loading) return <Loading />

    const featuredFields = (
        <div className="space-y-4">
            {featured.map((row, i) => (
                <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <p className="text-xs font-semibold text-slate-500">Featured slide {i + 1}</p>
                        <button
                            type="button"
                            onClick={() => setFeatured(featured.filter((_, j) => j !== i))}
                            className="text-red-500 hover:text-red-600 p-1"
                            aria-label="Remove slide"
                        >
                            <Trash2Icon size={16} />
                        </button>
                    </div>
                    <BannerImageField
                        label="Slide image"
                        url={row.image}
                        uploadVariant="featured"
                        getToken={getToken}
                        disabled={saving}
                        onUploaded={(u) => {
                            const n = [...featured]; n[i] = { ...n[i], image: u }; setFeatured(n)
                        }}
                    />
                    <Field label="Badge label" value={row.badgeLabel} onChange={(v) => {
                        const n = [...featured]; n[i] = { ...n[i], badgeLabel: v }; setFeatured(n)
                    }} />
                    <Field label="Badge text" value={row.badgeText} onChange={(v) => {
                        const n = [...featured]; n[i] = { ...n[i], badgeText: v }; setFeatured(n)
                    }} />
                    <Field label="Headline" value={row.title} onChange={(v) => {
                        const n = [...featured]; n[i] = { ...n[i], title: v }; setFeatured(n)
                    }} />
                    <Field label="Line 1" value={row.line1} onChange={(v) => {
                        const n = [...featured]; n[i] = { ...n[i], line1: v }; setFeatured(n)
                    }} />
                    <Field label="Line 2" value={row.line2} onChange={(v) => {
                        const n = [...featured]; n[i] = { ...n[i], line2: v }; setFeatured(n)
                    }} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Price label" value={row.priceLabel} onChange={(v) => {
                            const n = [...featured]; n[i] = { ...n[i], priceLabel: v }; setFeatured(n)
                        }} />
                        <Field label="Price" value={row.price} onChange={(v) => {
                            const n = [...featured]; n[i] = { ...n[i], price: v }; setFeatured(n)
                        }} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Button text" value={row.cta} onChange={(v) => {
                            const n = [...featured]; n[i] = { ...n[i], cta: v }; setFeatured(n)
                        }} />
                        <Field label="Button link" value={row.href} onChange={(v) => {
                            const n = [...featured]; n[i] = { ...n[i], href: v }; setFeatured(n)
                        }} />
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={() => setFeatured([...featured, emptyFeatured()])}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 w-full justify-center hover:bg-slate-50 dark:hover:bg-slate-900/50"
            >
                <PlusIcon size={16} /> Add featured slide
            </button>
        </div>
    )

    const promoBlock = (label, rows, setRows, sectionKey) => (
        <div className="space-y-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
            {rows.map((row, i) => (
                <div key={`${sectionKey}-${i}`} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <p className="text-xs font-semibold text-slate-500">Slide {i + 1}</p>
                        <button
                            type="button"
                            onClick={() => setRows(rows.filter((_, j) => j !== i))}
                            className="text-red-500 hover:text-red-600 p-1"
                            aria-label="Remove slide"
                        >
                            <Trash2Icon size={16} />
                        </button>
                    </div>
                    <BannerImageField
                        label="Slide image"
                        url={row.image}
                        uploadVariant="promo"
                        getToken={getToken}
                        disabled={saving}
                        onUploaded={(u) => {
                            const n = [...rows]; n[i] = { ...n[i], image: u }; setRows(n)
                        }}
                    />
                    <Field label="Title" value={row.title} onChange={(v) => {
                        const n = [...rows]; n[i] = { ...n[i], title: v }; setRows(n)
                    }} />
                    <Field label="Subtitle (e.g. View more)" value={row.subtitle} onChange={(v) => {
                        const n = [...rows]; n[i] = { ...n[i], subtitle: v }; setRows(n)
                    }} />
                    <Field label="Link" value={row.href} onChange={(v) => {
                        const n = [...rows]; n[i] = { ...n[i], href: v }; setRows(n)
                    }} />
                    <label className="block text-xs text-slate-500">
                        Background
                        <select
                            value={row.variant || "light"}
                            onChange={(e) => {
                                const n = [...rows]; n[i] = { ...n[i], variant: e.target.value }; setRows(n)
                            }}
                            className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 px-3 outline-none w-full max-w-xs text-slate-800 dark:text-slate-100 text-sm bg-white dark:bg-slate-950"
                        >
                            <option value="light">Light gray</option>
                            <option value="medium">Medium gray</option>
                            <option value="dark">Dark</option>
                        </select>
                    </label>
                </div>
            ))}
            <button
                type="button"
                onClick={() => setRows([...rows, emptyPromo()])}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 w-full justify-center hover:bg-slate-50 dark:hover:bg-slate-900/50"
            >
                <PlusIcon size={16} /> Add slide
            </button>
        </div>
    )

    return (
        <div className="text-slate-500 dark:text-slate-300 mb-28 max-w-3xl">
            <h1 className="text-2xl mb-1">Home page <span className="text-slate-800 dark:text-slate-100 font-medium">banners</span></h1>
            <p className="text-xs text-slate-400 mb-6">
                Upload images for each slide (JPEG, PNG, WebP, or GIF, max 5 MB). They are stored on ImageKit and served as optimized WebP.
                Leave every section empty to keep the built-in default banners on the storefront.
                Multiple slides in one section rotate automatically on the home page.
            </p>

            <div className="space-y-10">
                <section>
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Large featured carousel</h2>
                    {featuredFields}
                </section>
                <section className="grid md:grid-cols-2 gap-8">
                    <div>
                        {promoBlock("Right column — top promo stack", promo1, setPromo1, "p1")}
                    </div>
                    <div>
                        {promoBlock("Right column — bottom promo stack", promo2, setPromo2, "p2")}
                    </div>
                </section>
            </div>

            <div className="flex flex-wrap gap-3 mt-10">
                <button
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition text-sm disabled:opacity-50"
                >
                    <SaveIcon size={15} /> {saving ? "Saving…" : "Save home page"}
                </button>
                <button
                    type="button"
                    onClick={resetToBuiltIn}
                    disabled={saving}
                    className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40 disabled:opacity-50"
                >
                    Clear custom banners
                </button>
            </div>
        </div>
    )
}

function Field({ label, value, onChange, required }) {
    return (
        <label className="block text-xs text-slate-500">
            {label}
            {required && <span className="text-red-400"> *</span>}
            <input
                type="text"
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 px-3 outline-none w-full text-slate-800 dark:text-slate-100 text-sm bg-white dark:bg-slate-950"
            />
        </label>
    )
}

/**
 * @param {{ label: string, url: string, uploadVariant: 'featured' | 'promo', getToken: () => Promise<string | null>, disabled?: boolean, onUploaded: (url: string) => void }} props
 */
function BannerImageField({ label, url, uploadVariant, getToken, disabled, onUploaded }) {
    const inputRef = useRef(null)
    const [uploading, setUploading] = useState(false)

    const pickFile = () => inputRef.current?.click()

    const onFile = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return
        setUploading(true)
        try {
            const token = await getToken()
            const fd = new FormData()
            fd.append("image", file)
            fd.append("variant", uploadVariant)
            const { data } = await axios.post("/api/admin/home-page/upload", fd, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (data?.url) {
                onUploaded(data.url)
                toast.success("Image uploaded.")
            } else {
                toast.error("Upload did not return a URL.")
            }
        } catch (err) {
            toast.error(err?.response?.data?.error || err.message)
        }
        setUploading(false)
    }

    const hasUrl = typeof url === "string" && url.trim() !== ""

    return (
        <div className="space-y-2">
            <p className="text-xs text-slate-500">{label}</p>
            <div className="flex flex-wrap items-start gap-3">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={onFile}
                    disabled={disabled || uploading}
                />
                <button
                    type="button"
                    onClick={pickFile}
                    disabled={disabled || uploading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 disabled:opacity-50"
                >
                    <UploadIcon size={16} />
                    {uploading ? "Uploading…" : hasUrl ? "Replace image" : "Upload image"}
                </button>
                {hasUrl ? (
                    <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                        <Image src={url.trim()} alt="" fill className="object-cover" sizes="160px" unoptimized />
                    </div>
                ) : (
                    <span className="text-xs text-slate-400 py-2">No image yet — upload before saving.</span>
                )}
            </div>
        </div>
    )
}
