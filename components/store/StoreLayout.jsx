'use client'
import { useEffect, useState } from "react"
import Loading from "../Loading"
import Link from "next/link"
import { ArrowRightIcon, CircleDollarSignIcon, HomeIcon, LayoutListIcon, SquarePenIcon, SquarePlusIcon, StoreIcon, UserCircleIcon } from "lucide-react"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { ACTIVE_STORE_KEY, getStoreAuthHeaders } from "@/lib/storeAuthHeaders"
import DashboardShell from "@/components/dashboard/DashboardShell"
import Image from "next/image"

const StoreLayout = ({ children }) => {

    const {getToken} = useAuth()
    const { user } = useUser()
    const [isSeller, setIsSeller] = useState(false)
    const [loading, setLoading] = useState(true)
    const [storeInfo, setStoreInfo] = useState(null)
    const [stores, setStores] = useState([])

    const fetchIsSeller = async () => {
        try {
            const headers = await getStoreAuthHeaders(getToken)
            const {data} = await axios.get("/api/store/is-seller", {
                headers
            })
            setIsSeller(data.isSeller)
            setStoreInfo(data.storeInfo)
            setStores(data.stores || [])
            if (data.activeStoreId && typeof window !== "undefined") {
                localStorage.setItem(ACTIVE_STORE_KEY, data.activeStoreId)
            }
    
} catch (error) {
    console.log(error)
    
} finally {
    setLoading(false)
}
    }

    useEffect(() => {
        fetchIsSeller()
    }, [])

    return loading ? (
        <Loading />
    ) : isSeller ? (
        <DashboardShell
            user={user}
            badgeLabel="Seller"
            topbarSubtitle={storeInfo?.name ? `Active store: ${storeInfo.name}` : "Manage your store, products, orders & payouts"}
            rightSlot={
                <Link
                    href="/"
                    className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950/40 transition"
                >
                    Home <ArrowUpRightIcon size={14} />
                </Link>
            }
            navItems={[
                { name: 'Dashboard',       href: '/store',                icon: HomeIcon },
                { name: 'Add Product',     href: '/store/add-product',    icon: SquarePlusIcon },
                { name: 'Manage Product',  href: '/store/manage-product', icon: SquarePenIcon },
                { name: 'Orders',          href: '/store/orders',         icon: LayoutListIcon },
                { name: 'Payouts',         href: '/store/payouts',        icon: CircleDollarSignIcon },
                { name: 'Store Profile',   href: '/store/profile',        icon: UserCircleIcon },
                { name: 'My Stores',       href: '/store/stores',         icon: StoreIcon },
            ]}
            sidebarHeader={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shrink-0">
                        {storeInfo?.logo ? (
                            <Image src={storeInfo.logo} alt="" width={40} height={40} className="w-10 h-10 object-cover" />
                        ) : null}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-400">
                            Seller Workspace
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {storeInfo?.name || "Store"}
                        </p>
                        {stores?.length > 1 && (
                            <select
                                value={storeInfo?.id || ""}
                                onChange={(e) => {
                                    localStorage.setItem(ACTIVE_STORE_KEY, e.target.value);
                                    fetchIsSeller();
                                }}
                                className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-800 text-xs px-2.5 py-2 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
                            >
                                {stores.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            }
        >
            {children}
        </DashboardShell>
    ) : (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">You are not authorized to access this page</h1>
            <Link href="/" className="bg-slate-700 text-white flex items-center gap-2 mt-8 p-2 px-6 max-sm:text-sm rounded-full">
                Go to home <ArrowRightIcon size={18} />
            </Link>
        </div>
    )
}

export default StoreLayout
