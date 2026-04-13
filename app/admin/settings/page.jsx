'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { SaveIcon } from "lucide-react"

export default function AdminSettings() {
    const { getToken } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [config, setConfig] = useState({
        commission_rate: 5,
        shipping_base_fee: 7000,
        shipping_abroad_fee: 15000,
        shipping_free_above: 0,
    })

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const { data } = await axios.get("/api/admin/config", { headers: { Authorization: `Bearer ${token}` } })
                setConfig(data.config)
            } catch (e) { toast.error(e?.response?.data?.error || e.message) }
            setLoading(false)
        })()
    }, [])

    const save = async () => {
        setSaving(true)
        try {
            const token = await getToken()
            await axios.post("/api/admin/config", config, { headers: { Authorization: `Bearer ${token}` } })
            toast.success("Settings saved successfully.")
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
        setSaving(false)
    }

    if (loading) return <Loading />

    const fields = [
        {
            key: 'commission_rate',
            label: 'Platform Commission Rate (%)',
            description: 'Percentage taken from each seller sale. e.g. 5 = 5%.',
            min: 0, max: 100, step: 0.5,
        },
        {
            key: 'shipping_base_fee',
            label: `Local Shipping Fee (${currency})`,
            description: '🏠 Flat fee for local products. Delivery: 7–10 days. COD available.',
            min: 0, step: 100,
        },
        {
            key: 'shipping_abroad_fee',
            label: `Abroad Shipping Fee (${currency})`,
            description: '✈️ Flat fee for products Shipped from Abroad. Delivery: 20–25 days. No COD.',
            min: 0, step: 100,
        },
        {
            key: 'shipping_free_above',
            label: `Free Local Shipping Threshold (${currency})`,
            description: `Local orders above this total get free shipping for non-Plus buyers. Set to 0 to disable. Does not apply to abroad shipments.`,
            min: 0, step: 1000,
        },
    ]

    return (
        <div className="text-slate-500 mb-28 max-w-2xl">
            <h1 className="text-2xl mb-1">Platform <span className="text-slate-800 font-medium">Settings</span></h1>
            <p className="text-xs text-slate-400 mb-8">Changes take effect immediately for all new orders.</p>

            <div className="space-y-6">
                {fields.map(field => (
                    <div key={field.key} className="border border-slate-200 rounded-xl p-5">
                        <label className="block">
                            <p className="font-medium text-slate-700 text-sm">{field.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5 mb-3">{field.description}</p>
                            <input
                                type="number"
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                value={config[field.key]}
                                onChange={e => setConfig({ ...config, [field.key]: e.target.value })}
                                className="border border-slate-200 rounded-lg p-2.5 px-4 outline-none w-full max-w-xs text-slate-800 text-sm"
                            />
                        </label>
                    </div>
                ))}
            </div>

            <button onClick={save} disabled={saving}
                className="flex items-center gap-2 mt-8 px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition text-sm disabled:opacity-50">
                <SaveIcon size={15} /> {saving ? "Saving..." : "Save Settings"}
            </button>
        </div>
    )
}
