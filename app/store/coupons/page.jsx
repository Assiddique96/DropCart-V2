'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { getStoreAuthHeaders } from "@/lib/storeAuthHeaders"
import {
  PlusIcon, Trash2Icon, TagIcon, SearchIcon, XIcon,
  InfinityIcon, PercentIcon, BanknoteIcon
} from "lucide-react"

const EMPTY_COUPON = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discount: '',
  forNewUser: false,
  forMember: false,
  isPublic: true,
  expiresAt: '',
  maxUses: '',
  minOrderValue: '',
}

export default function StoreCoupons() {
  const { getToken } = useAuth()
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'

  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_COUPON)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')

  const fetchCoupons = async () => {
    try {
      const headers = await getStoreAuthHeaders(getToken)
      const { data } = await axios.get("/api/store/coupons", { headers })
      setCoupons(data.coupons || [])
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message)
    }
    setLoading(false)
  }

  useEffect(() => { fetchCoupons() }, [])

  const createCoupon = async () => {
    if (!form.code.trim()) return toast.error("Coupon code is required.")
    if (!form.discount || Number(form.discount) <= 0) return toast.error("Discount must be a positive number.")
    if (!form.expiresAt) return toast.error("Expiry date is required.")
    if (new Date(form.expiresAt) <= new Date()) return toast.error("Expiry date must be in the future.")

    setCreating(true)
    try {
      const headers = await getStoreAuthHeaders(getToken)
      await axios.post("/api/store/coupons", { coupon: {
        ...form,
        code: form.code.toUpperCase().trim(),
        discount: Number(form.discount),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
        expiresAt: new Date(form.expiresAt).toISOString(),
      }}, { headers })
      toast.success("Coupon created!")
      setForm(EMPTY_COUPON)
      setShowForm(false)
      fetchCoupons()
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message)
    }
    setCreating(false)
  }

  const deleteCoupon = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const headers = await getStoreAuthHeaders(getToken)
      await axios.delete(`/api/store/coupons?code=${encodeURIComponent(confirmDelete)}`, { headers })
      toast.success("Coupon deleted.")
      setCoupons(prev => prev.filter(c => c.code !== confirmDelete))
      setConfirmDelete(null)
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message)
    }
    setDeleting(false)
  }

  const filtered = coupons.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.code.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
  })

  const isExpired = (date) => new Date(date) < new Date()
  const usagePct = (c) => c.maxUses ? Math.round((c.usageCount / c.maxUses) * 100) : null

  if (loading) return <Loading />

  return (
    <div className="text-slate-500 dark:text-slate-300 mb-28">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl">Store <span className="text-slate-800 dark:text-slate-100 font-medium">Coupons</span></h1>
          <p className="text-xs text-slate-400 mt-0.5">Create store-specific discount codes for your buyers.</p>
        </div>
        <div className="flex gap-3">
          {coupons.length > 0 && (
            <div className="relative">
              <SearchIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search coupons..."
                className="border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-7 py-2 text-sm outline-none w-44 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><XIcon size={12} /></button>}
            </div>
          )}
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-sm rounded-xl hover:bg-slate-900 dark:hover:bg-slate-200 transition font-semibold">
            <PlusIcon size={15} /> New Coupon
          </button>
        </div>
      </div>

      {/* Create coupon form */}
      {showForm && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-6 bg-slate-50 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <TagIcon size={15} /> Create new coupon
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Code *</label>
              <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SUMMER20"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-mono" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Description</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Summer sale discount"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Discount type</label>
              <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed amount ({currency})</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">
                Discount {form.discountType === 'PERCENTAGE' ? '(%)' : `(${currency})`} *
              </label>
              <input type="number" min="0.01" max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })}
                placeholder={form.discountType === 'PERCENTAGE' ? '0–100' : '0.00'}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Expires at *</label>
              <input type="datetime-local" value={form.expiresAt}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Max uses (leave blank for unlimited)</label>
              <input type="number" min="1" value={form.maxUses}
                onChange={e => setForm({ ...form, maxUses: e.target.value })}
                placeholder="Unlimited"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-300 mb-1 block">Min order value ({currency})</label>
              <input type="number" min="0" value={form.minOrderValue}
                onChange={e => setForm({ ...form, minOrderValue: e.target.value })}
                placeholder="No minimum"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100" />
            </div>
            <div className="flex flex-col gap-2 justify-end">
              <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-700 dark:text-slate-200">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={form.isPublic}
                    onChange={e => setForm({ ...form, isPublic: e.target.checked })} />
                  <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-500 transition-colors" />
                  <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </div>
                Publicly visible
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-700 dark:text-slate-200">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={form.forNewUser}
                    onChange={e => setForm({ ...form, forNewUser: e.target.checked })} />
                  <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-500 transition-colors" />
                  <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </div>
                New users only
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={createCoupon} disabled={creating}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-800 text-white text-sm rounded-xl hover:bg-slate-900 transition disabled:opacity-50 font-semibold">
              <TagIcon size={14} /> {creating ? "Creating..." : "Create Coupon"}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_COUPON) }}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Coupons list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <TagIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{coupons.length === 0 ? "No coupons yet." : "No coupons match your search."}</p>
          <p className="text-xs mt-1">Create a coupon to offer discounts to buyers at your store.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(c => {
            const expired = isExpired(c.expiresAt)
            const pct = usagePct(c)
            return (
              <div key={c.code} className={`border rounded-2xl p-4 bg-white dark:bg-slate-900 ${expired ? 'border-slate-200 dark:border-slate-800 opacity-60' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-mono text-lg font-bold text-slate-800 dark:text-slate-100 tracking-widest">{c.code}</p>
                    {c.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {expired && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-semibold">Expired</span>
                    )}
                    <button onClick={() => setConfirmDelete(c.code)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition">
                      <Trash2Icon size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 text-sm font-bold ${c.discountType === 'PERCENTAGE' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {c.discountType === 'PERCENTAGE'
                      ? <><PercentIcon size={13} /> {c.discount}% off</>
                      : <><BanknoteIcon size={13} /> {currency}{c.discount.toLocaleString()} off</>
                    }
                  </span>
                  {c.minOrderValue > 0 && (
                    <span className="text-[11px] text-slate-500">· Min {currency}{c.minOrderValue.toLocaleString()}</span>
                  )}
                </div>

                {/* Usage bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>{c.usageCount} uses</span>
                    {c.maxUses
                      ? <span>of {c.maxUses} max</span>
                      : <span className="flex items-center gap-0.5"><InfinityIcon size={11} /> unlimited</span>
                    }
                  </div>
                  {c.maxUses && (
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {c.isPublic && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">Public</span>
                  )}
                  {c.forNewUser && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">New users</span>
                  )}
                  {c.forMember && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">Members</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Expires {new Date(c.expiresAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Delete coupon?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-300 mb-4">
              Delete <span className="font-mono font-bold">{confirmDelete}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={deleteCoupon} disabled={deleting}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-sm hover:bg-slate-200 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
