'use client'
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { PlusIcon, SaveIcon, Trash2Icon, ImageIcon, UploadIcon, XIcon } from "lucide-react"

const emptyCategory = () => ({ name: "", subcategories: [""] })
const emptyFaq = () => ({ question: "", answer: "" })
const emptyBanner = () => ({ id: `temp-${Date.now()}`, title: "", subtitle: "", cta: "View deals", href: "/shop", image: "" })

function BannerImageField({ label, url, getToken, disabled, onChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const pickFile = () => inputRef.current?.click()

  const onFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setUploading(true)
    setUploadSuccess(false)
    try {
      const token = await getToken()
      const fd = new FormData()
      fd.append("image", file)
      const { data } = await axios.post("/api/admin/middle-banners/upload", fd, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data?.url) {
        onChange(data.url)
        setUploadSuccess(true)
        toast.success("Image uploaded.")
      } else {
        toast.error("Upload did not return a URL.")
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    }
    setUploading(false)
  }

  const hasUrl = typeof url === "string" && url.trim() !== ""

  return (
    <div className="sm:col-span-2 space-y-3">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="grid gap-3">
        <label className="text-xs text-slate-500 block">
          Image URL
          <input
            type="text"
            value={url ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/banner.jpg"
            className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-100"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
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
          {hasUrl && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 text-sm text-red-600 hover:bg-red-50"
            >
              <XIcon size={14} /> Clear
            </button>
          )}
        </div>
        {hasUrl ? (
          <>
            <div className="relative h-24 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url.trim()} alt="Banner preview" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            </div>
            {uploadSuccess && !uploading && (
              <p className="text-xs text-emerald-600">Image successfully uploaded and set.</p>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-400">You can paste an image URL or upload a file directly.</p>
        )}
      </div>
    </div>
  )
}

export default function AdminContentPage() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingBanners, setSavingBanners] = useState(false)

  const [categories, setCategories] = useState([])
  const [faqItems, setFaqItems] = useState([])
  const [privacyPolicy, setPrivacyPolicy] = useState("")
  const [termsOfUse, setTermsOfUse] = useState("")
  const [cookiesPolicy, setCookiesPolicy] = useState("")

  // Middle banners
  const [middleBanners, setMiddleBanners] = useState([])

useEffect(() => {
  ;(async () => {
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [contentRes, bannerRes] = await Promise.all([
        axios.get("/api/admin/content", { headers }),
        axios.get("/api/admin/middle-banners", { headers }),
      ])
      
      setCategories(contentRes.data.categories || [])
      setFaqItems(contentRes.data.faqItems || [])
      setPrivacyPolicy(contentRes.data.privacyPolicy || "")
      setTermsOfUse(contentRes.data.termsOfUse || "")
      setCookiesPolicy(contentRes.data.cookiesPolicy || "")

      // 🔥 FIX: Map backend/Prisma keys to your frontend form keys
      const formattedBanners = (bannerRes.data.banners || []).map(b => ({
        id: b.id,
        title: b.title || "",
        subtitle: b.subtitle || "",
        cta: b.ctaText || "View deals",  // Maps ctaText -> cta
        href: b.linkUrl || "/shop",     // Maps linkUrl -> href
        image: b.imageUrl || "",        // Maps imageUrl -> image
      }))
      
      setMiddleBanners(formattedBanners)
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
      await axios.post(
        "/api/admin/content",
        { categories, faqItems, privacyPolicy, termsOfUse, cookiesPolicy },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Content saved successfully.")
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message)
    }
    setSaving(false)
  }

  const saveBanners = async () => {
    setSavingBanners(true)
    try {
      const token = await getToken()
      await axios.put("/api/admin/middle-banners", { banners: middleBanners }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success("Middle banners saved.")
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message)
    }
    setSavingBanners(false)
  }

  if (loading) return <Loading />

  const updateCategory = (idx, field, value) =>
    setCategories((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))

  const updateSubcategory = (categoryIdx, subIdx, value) =>
    setCategories((prev) => prev.map((item, i) => {
      if (i !== categoryIdx) return item
      const list = [...(item.subcategories || [])]
      list[subIdx] = value
      return { ...item, subcategories: list }
    }))

  const removeCategory = (idx) => setCategories((prev) => prev.filter((_, i) => i !== idx))
  const addCategory = () => setCategories((prev) => [...prev, emptyCategory()])
  const addFaq = () => setFaqItems((prev) => [...prev, emptyFaq()])
  const removeFaq = (idx) => setFaqItems((prev) => prev.filter((_, i) => i !== idx))

  const addSubcategory = (categoryIdx) => setCategories((prev) => prev.map((item, i) => {
    if (i !== categoryIdx) return item
    return { ...item, subcategories: [...(item.subcategories || []), ""] }
  }))

  const removeSubcategory = (categoryIdx, subIdx) => setCategories((prev) => prev.map((item, i) => {
    if (i !== categoryIdx) return item
    return { ...item, subcategories: (item.subcategories || []).filter((_, j) => j !== subIdx) }
  }))

  const updateBanner = (idx, field, value) =>
    setMiddleBanners((prev) => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b))
  const addBanner = () => setMiddleBanners((prev) => [...prev, emptyBanner()])
  const removeBanner = (idx) => setMiddleBanners((prev) => prev.filter((_, i) => i !== idx))

  return (
    <div className="text-slate-500 dark:text-slate-300 mb-28 max-w-6xl">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl">Site <span className="text-slate-800 dark:text-slate-100 font-medium">Content</span></h1>
        <p className="text-xs text-slate-400 max-w-2xl">Manage product categories, sub-categories, middle banners, privacy policy, terms of use, FAQs, and cookies policy from the admin console.</p>
      </div>

      <div className="space-y-10">
        {/* ─── MIDDLE BANNERS ─────────────────────────────────────────────────── */}
        <section className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ImageIcon size={18} className="text-cyan-500" />
                Homepage Middle Banners
              </h2>
              <p className="text-xs text-slate-400 mt-1">These banners appear in the "Flash deals / International shipping / Installment plans" section on the homepage. Paste an image URL from your hosting or Cloudinary.</p>
            </div>
            <button onClick={addBanner} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950 transition flex items-center gap-2">
              <PlusIcon size={14} /> Add banner
            </button>
          </div>
          <div className="space-y-4">
            {middleBanners.map((banner, idx) => (
              <div key={banner.id || idx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-950">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Banner {idx + 1}</p>
                  <button type="button" onClick={() => removeBanner(idx)} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                    <Trash2Icon size={13} /> Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs text-slate-500 block">
                    Title *
                    <input value={banner.title} onChange={(e) => updateBanner(idx, "title", e.target.value)}
                      placeholder="Flash deals for SMEs"
                      className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-100" />
                  </label>
                  <label className="text-xs text-slate-500 block">
                    Subtitle
                    <input value={banner.subtitle} onChange={(e) => updateBanner(idx, "subtitle", e.target.value)}
                      placeholder="Limited-time bulk discounts on core gadgets"
                      className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-100" />
                  </label>
                  <label className="text-xs text-slate-500 block">
                    CTA Button Text
                    <input value={banner.cta} onChange={(e) => updateBanner(idx, "cta", e.target.value)}
                      placeholder="View deals"
                      className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-100" />
                  </label>
                  <label className="text-xs text-slate-500 block">
                    Link (href)
                    <input value={banner.href} onChange={(e) => updateBanner(idx, "href", e.target.value)}
                      placeholder="/shop or /wholesale"
                      className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-100" />
                  </label>
                  <BannerImageField
                    label="Image URL or upload"
                    url={banner.image}
                    getToken={getToken}
                    disabled={savingBanners}
                    onChange={(value) => updateBanner(idx, "image", value)}
                  />
                </div>
              </div>
            ))}
            {middleBanners.length === 0 && (
              <div className="text-sm text-slate-400">No banners defined yet. Add a banner to update the homepage middle section.</div>
            )}
          </div>
          <button onClick={saveBanners} disabled={savingBanners}
            className="flex items-center gap-2 mt-6 px-6 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-sm disabled:opacity-50">
            <SaveIcon size={15} /> {savingBanners ? "Saving..." : "Save middle banners"}
          </button>
        </section>

        {/* ─── CATEGORIES ──────────────────────────────────────────────────────── */}
        <section className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Categories & Sub-Categories</h2>
              <p className="text-xs text-slate-400 mt-1">Define the category menu used by the marketplace and admin product tools.</p>
            </div>
            <button onClick={addCategory} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950 transition">Add category</button>
          </div>
          <div className="space-y-4">
            {categories.map((category, idx) => (
              <div key={`cat-${idx}`} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <label className="flex-1 text-xs text-slate-500">
                    Category name
                    <input value={category.name} onChange={(e) => updateCategory(idx, "name", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-100" />
                  </label>
                  <button type="button" onClick={() => removeCategory(idx)} className="self-start text-xs text-red-500 hover:text-red-600">Remove category</button>
                </div>
                <div className="space-y-3">
                  {(category.subcategories || []).map((sub, subIdx) => (
                    <div key={`sub-${idx}-${subIdx}`} className="grid grid-cols-[1fr,auto] gap-3 items-center">
                      <input value={sub} onChange={(e) => updateSubcategory(idx, subIdx, e.target.value)}
                        placeholder="Sub-category name"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-100" />
                      <button type="button" onClick={() => removeSubcategory(idx, subIdx)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950">Remove</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addSubcategory(idx)}
                    className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-950 transition">Add sub-category</button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <div className="text-sm text-slate-400">No categories defined yet.</div>}
          </div>
        </section>

        {/* ─── FAQ ──────────────────────────────────────────────────────────────── */}
        <section className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Frequently Asked Questions</h2>
              <p className="text-xs text-slate-400 mt-1">Update the FAQ items shown on the public FAQ page.</p>
            </div>
            <button onClick={addFaq} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950 transition">Add FAQ</button>
          </div>
          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div key={`faq-${idx}`} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-950">
                <div className="flex justify-between items-center gap-3 mb-3">
                  <p className="text-xs text-slate-500">FAQ {idx + 1}</p>
                  <button type="button" onClick={() => removeFaq(idx)} className="text-xs text-red-500 hover:text-red-600">Remove</button>
                </div>
                <label className="text-xs text-slate-500 block mb-2">
                  Question
                  <input value={item.question} onChange={(e) => setFaqItems((prev) => prev.map((faq, i) => i === idx ? { ...faq, question: e.target.value } : faq))}
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-100" />
                </label>
                <label className="text-xs text-slate-500 block">
                  Answer
                  <textarea value={item.answer} onChange={(e) => setFaqItems((prev) => prev.map((faq, i) => i === idx ? { ...faq, answer: e.target.value } : faq))}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-100" />
                </label>
              </div>
            ))}
            {faqItems.length === 0 && <div className="text-sm text-slate-400">No FAQ items yet.</div>}
          </div>
        </section>

        {/* ─── POLICIES ─────────────────────────────────────────────────────────── */}
        <section className="grid gap-10 lg:grid-cols-3">
          {[
            { label: "Privacy Policy", value: privacyPolicy, set: setPrivacyPolicy, placeholder: "Enter privacy policy text here..." },
            { label: "Terms of Use", value: termsOfUse, set: setTermsOfUse, placeholder: "Enter terms of use text here..." },
            { label: "Cookies Policy", value: cookiesPolicy, set: setCookiesPolicy, placeholder: "Enter cookies policy text here..." },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">{label}</h2>
              <textarea value={value} onChange={(e) => set(e.target.value)} rows={14} placeholder={placeholder}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm outline-none text-slate-800 dark:text-slate-100" />
            </div>
          ))}
        </section>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 mt-8 px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition text-sm disabled:opacity-50">
        <SaveIcon size={15} /> {saving ? "Saving..." : "Save content changes"}
      </button>
    </div>
  )
}
