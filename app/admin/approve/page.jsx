'use client'
import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import axios from "axios"

export default function AdminApprove() {

    const {user} = useUser()
    const {getToken} = useAuth()
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)


    const fetchStores = async () => {
        try {
            const token = await getToken()
            const {data} = await axios.get("/api/admin/pending-stores", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setStores(data.stores)

        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
        setLoading(false)
    }

    const handleApprove = async ({ storeId, status }) => {
        // Logic to approve a store
        try {
             const token = await getToken()
            const {data} = await axios.post("/api/admin/approve-store", {storeId, status}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            toast.success(data.message)
            await fetchStores()
         
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }


    }

    useEffect(() => {
        if (user){
            fetchStores()
        }
    }, [user])

    return !loading ? (
        <div className="text-slate-500 dark:text-slate-300 mb-28">
            <h1 className="text-2xl">Store <span className="text-slate-800 dark:text-slate-100 font-medium">Verification</span></h1>

            {stores.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl" >
                            {/* Store Info */}
                            <StoreInfo store={store} />

                            {/* Actions */}
                            <div className="flex gap-3 pt-2 flex-wrap">
                                <button onClick={() => toast.promise(handleApprove({ storeId: store.id, status: 'approved' }), { loading: "approving" })} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm" >
                                    Approve
                                </button>
                                <button onClick={() => toast.promise(handleApprove({ storeId: store.id, status: 'pending' }), { loading: 'marking pending' })} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 text-sm" >
                                    Mark Pending
                                </button>
                                <button onClick={() => toast.promise(handleApprove({ storeId: store.id, status: 'rejected' }), { loading: 'rejecting' })} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm" >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}

                </div>) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No stores waiting for verification</h1>
                </div>
            )}
        </div>
    ) : <Loading />
}