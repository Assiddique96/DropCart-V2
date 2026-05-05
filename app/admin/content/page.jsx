'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"

const emptyCategory = () => ({ name: "", subcategories: [""] })
const emptyFaq = () => ({ question: "", answer: "" })

export default function AdminContentPage() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  const [faqItems, setFaqItems] = useState([])
  const [privacyPolicy, setPrivacyPolicy] = useState("")
  const [termsOfUse, setTermsOfUse] = useState("")
  const [cookiesPolicy, setCookiesPolicy] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const token = await getToken()
        const { data } = await axios.get("/api/admin/content", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCategories(data.categories || [])
        setFaqItems(data.faqItems || [])
        setPrivacyPolicy(data.privacyPolicy || "")
        setTermsOfUse(data.termsOfUse || "")
        setCookiesPolicy(data.cookiesPolicy || "")
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

  if (loading) return <Loading />

  const updateCategory = (idx, field, value) => {
    setCategories((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const updateSubcategory = (categoryIdx, subIdx, value) => {
    setCategories((prev) => prev.map((item, i) => {
      if (i !== categoryIdx) return item
      const list = [...(item.subcategories || [])]
      list[subIdx] = value
      return { ...item, subcategories: list }
    }))
  }

  const removeCategory = (idx) => setCategories((prev) => prev.filter((_, i) => i !== idx))
  const addCategory = () => setCategories((prev) => [...prev, { name: "", subcategories: [""] }])
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

  return (
    <div className="text-slate-500 dark:text-slate-300 mb-28 max-w-6xl">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl">Site <span className="text-slate-800 dark:text-slate-100 font-medium">Content</span></h1>
        <p className="text-xs text-slate-400 max-w-2xl">Manage product categories, sub-categories, privacy policy, terms of use, FAQs, and cookies policy from the admin console.</p>
      </div>

      <div className="space-y-10">
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
                  <button type="button" onClick={() => removeCategory(idx)}
                    className="self-start text-xs text-red-500 hover:text-red-600">Remove category</button>
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
            {categories.length === 0 && (
              <div className="text-sm text-slate-400">No categories defined yet. Add a category to get started.</div>
            )}
          </div>
        </section>

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
            {faqItems.length === 0 && (
              <div className="text-sm text-slate-400">No FAQ items yet. Add questions to show them on the public FAQ page.</div>
            )}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-3">
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Privacy Policy</h2>
            <textarea value={privacyPolicy} onChange={(e) => setPrivacyPolicy(e.target.value)} rows={14}
              placeholder="Enter privacy policy text here..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm outline-none text-slate-800 dark:text-slate-100" />
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Terms of Use</h2>
            <textarea value={termsOfUse} onChange={(e) => setTermsOfUse(e.target.value)} rows={14}
              placeholder="Enter terms of use text here..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm outline-none text-slate-800 dark:text-slate-100" />
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Cookies Policy</h2>
            <textarea value={cookiesPolicy} onChange={(e) => setCookiesPolicy(e.target.value)} rows={14}
              placeholder="Enter cookies policy text here..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm outline-none text-slate-800 dark:text-slate-100" />
          </div>
        </section>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 mt-8 px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition text-sm disabled:opacity-50">
        <SaveIcon size={15} /> {saving ? "Saving..." : "Save content changes"}
      </button>
    </div>
  )
}
