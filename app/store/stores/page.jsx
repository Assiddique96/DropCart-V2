'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Image from "next/image"
import Link from "next/link"
import Loading from "@/components/Loading"
import { ACTIVE_STORE_KEY, getStoreAuthHeaders } from "@/lib/storeAuthHeaders"

export default function MyStoresPage() {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stores, setStores] = useState([])
    const [activeStoreId, setActiveStoreId] = useState("")

    const fetchStores = async () => {
        setLoading(true)
        try {
            const { data } = await axios.get("/api/store/my-stores", { headers: await getStoreAuthHeaders(getToken) })
            setStores(data.stores || [])
            const selected = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_STORE_KEY) : ""
            setActiveStoreId(selected || data.stores?.[0]?.id || "")
        } catch (e) {
            toast.error(e?.response?.data?.error || e.message)
        }
        setLoading(false)
    }

    useEffect(() => { fetchStores() }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <h1 className="text-2xl">My <span className="text-slate-800 font-medium">Stores</span></h1>
                <Link href="/create-store" className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition">
                    Create another store
                </Link>
            </div>

            {stores.length === 0 ? (
                <p className="text-slate-400">No stores found yet.</p>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stores.map((store) => (
                        <div key={store.id} className="border border-slate-200 rounded-xl p-4 bg-white">
                            <div className="flex items-center gap-3">
                                <Image src={store.logo} alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover border border-slate-100" />
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-800 truncate">{store.name}</p>
                                    <p className="text-xs text-slate-400 truncate">@{store.username}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs">
                                <span className={`px-2 py-0.5 rounded-full ${store.status === "approved" ? "bg-green-50 text-green-700" : store.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                                    {store.status}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full ${store.isActive ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                                    {store.isActive ? "active" : "inactive"}
                                </span>
                            </div>
                            <button
                                disabled={store.status !== "approved"}
                                onClick={() => {
                                    localStorage.setItem(ACTIVE_STORE_KEY, store.id)
                                    setActiveStoreId(store.id)
                                    toast.success("Active store switched.")
                                }}
                                className={`mt-4 text-xs px-3 py-2 rounded-lg transition ${
                                    activeStoreId === store.id
                                        ? "bg-slate-200 text-slate-700"
                                        : "bg-slate-800 text-white hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400"
                                }`}
                            >
                                {activeStoreId === store.id ? "Current active store" : "Set as active"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
