'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { SaveIcon } from "lucide-react"
import { getStoreAuthHeaders } from "@/lib/storeAuthHeaders"

export default function DeliveryFeeSettings() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [store, setStore] = useState(null)
  const [form, setForm] = useState({
    shippingLocalFee: "",
    shippingNationwideFee: "",
    shippingAbroadFee: "",
  })

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const { data } = await axios.get("/api/store/profile", {
          headers: await getStoreAuthHeaders(getToken)
        })
        setStore(data.store)
        setForm({
          shippingLocalFee: data.store.shippingLocalFee ?? "",
          shippingNationwideFee: data.store.shippingNationwideFee ?? "",
          shippingAbroadFee: data.store.shippingAbroadFee ?? "",
        })
      } catch (error) {
        toast.error(error.response?.data?.error || error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStore()
  }, [getToken])

  const onSave = async () => {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append("shippingLocalFee", String(form.shippingLocalFee))
      formData.append("shippingNationwideFee", String(form.shippingNationwideFee))
      formData.append("shippingAbroadFee", String(form.shippingAbroadFee))
      const { data } = await axios.patch("/api/store/profile", formData, {
        headers: await getStoreAuthHeaders(getToken),
      })
      setStore(data.store)
      toast.success(data.message)
    } catch (error) {
      toast.error(error.response?.data?.error || error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  const hasDeliveryStates = store?.deliveryStates && store.deliveryStates.length > 0
  const stateLabel = hasDeliveryStates
    ? `within ${store.deliveryStates.join(", ")}`
    : store?.state
    ? `within ${store.state}`
    : "within your state"
  const countryLabel = store?.country || "Nigeria"

  return (
    <div className="text-slate-500 dark:text-slate-300 mb-28 max-w-3xl">
      <h1 className="text-2xl mb-2">Delivery Fee Settings</h1>
      <div className="mb-4 text-sm text-slate-400">
        <p>Seller location: <span className="text-slate-700 dark:text-slate-100">{hasDeliveryStates ? store.deliveryStates.join(", ") : store?.state || 'State not set'}{store?.country ? `, ${store.country}` : ''}</span></p>
        <p>Set your local, nationwide, and international delivery fees here. Use 0 for free delivery.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            key: "shippingLocalFee",
            label: `Within State (${stateLabel})`,
            help: "Delivered within 1 - 3 days",
          },
          {
            key: "shippingNationwideFee",
            label: `Nationwide (${countryLabel})`,
            help: "Delivered within 5 - 7 days",
          },
          {
            key: "shippingAbroadFee",
            label: "International (Abroad)",
            help: "Delivered within 20 - 25 days",
          },
        ].map((item) => (
          <div key={item.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition dark:border-slate-700 dark:bg-slate-950">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">{item.label}</h2>
            <p className="text-xs text-slate-400 mb-4">{item.help}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">₦</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form[item.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [item.key]: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Enter 0 for free delivery.</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-800 px-6 py-3 text-sm font-medium text-white hover:bg-slate-900 transition disabled:opacity-50"
      >
        <SaveIcon size={16} /> {saving ? "Saving..." : "Save Delivery Fees"}
      </button>
    </div>
  )
}
