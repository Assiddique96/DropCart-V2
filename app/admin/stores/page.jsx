'use client'
import { SearchIcon, XIcon } from "lucide-react"
import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import axios from "axios"
export default function AdminStores() {

    const {user} = useUser()
    const {getToken} = useAuth()
    const [stores, setStores] = useState([])
    const [counts, setCounts] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 })
    const [statusFilter, setStatusFilter] = useState("all")
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    const fetchStores = async () => {
        try {
            const token = await getToken()
            const {data} = await axios.get("/api/admin/stores", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setStores(data.stores || [])
            setCounts(data.counts || { total: 0, approved: 0, pending: 0, rejected: 0 })
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        } 
            setLoading(false)
        
    }

    const toggleIsActive = async (storeId) => {
        // Logic to toggle the status of a store

        try {
            const token = await getToken()
            const {data} = await axios.post("/api/admin/toggle-store", {storeId}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            await fetchStores()
            toast.success(data.message)
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }

    }

    useEffect(() => {
        if (user){
            fetchStores()
        }
    }, [user])

    const filteredStores = stores.filter(store => {
        if (statusFilter !== 'all' && store.status !== statusFilter) return false
        if (search.trim()) {
            const q = search.toLowerCase()
            if (!store.name?.toLowerCase().includes(q) && !store.username?.toLowerCase().includes(q) && !store.email?.toLowerCase().includes(q)) return false
        }
        return true
    })

    return !loading ? (
        <div className="text-slate-500 dark:text-slate-300 mb-28">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <h1 className="text-2xl">All <span className="text-slate-800 dark:text-slate-100 font-medium">Stores</span></h1>
                <div className="relative">
                    <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stores..."
                        className="border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-8 py-2 text-sm outline-none w-56 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"><XIcon size={13} /></button>}
                </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {[
                    { key: "all", label: `All (${counts.total})` },
                    { key: "approved", label: `Approved (${counts.approved})` },
                    { key: "pending", label: `Pending (${counts.pending})` },
                    { key: "rejected", label: `Rejected (${counts.rejected})` },
                ].map((item) => (
                    <button
                        key={item.key}
                        onClick={() => setStatusFilter(item.key)}
                        className={`px-3 py-1.5 rounded-full border transition ${
                            statusFilter === item.key
                                ? "bg-slate-800 text-white border-slate-800"
                                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {filteredStores.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {filteredStores.map((store) => (
                        <div key={store.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl" >
                            {/* Store Info */}
                            <StoreInfo store={store} />

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2 flex-wrap">
                                <p>Active</p>
                                <label className="relative inline-flex items-center cursor-pointer text-slate-700 dark:text-slate-200">
                                    <input type="checkbox" className="sr-only peer" onChange={() => toast.promise(toggleIsActive(store.id), { loading: "Updating data..." })} checked={store.isActive} />
                                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                    <span className="dot absolute left-1 top-1 w-3 h-3 bg-white dark:bg-slate-900 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                </label>
                            </div>
                        </div>
                    ))}

                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No stores found</h1>
                </div>
            )
            }
        </div>
    ) : <Loading />
}