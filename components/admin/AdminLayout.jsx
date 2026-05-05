'use client'
import { useEffect, useState } from "react"
import Loading from "../Loading"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { CircleDollarSignIcon, HomeIcon, RotateCcwIcon, SettingsIcon, ShieldCheckIcon, ShoppingBasketIcon, StoreIcon, TicketPercentIcon, UsersIcon, PackageIcon, ArrowUpRightIcon, Images } from "lucide-react"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import DashboardShell from "@/components/dashboard/DashboardShell"

const AdminLayout = ({ children }) => {

    const { user } = useUser()
    const {getToken} = useAuth()



    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchIsAdmin = async () => {
        try {
            const token = await getToken()
            const {data} = await axios.get("/api/admin/is-admin", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setIsAdmin(data.isAdmin)            
        } catch (error) {
            console.log(error)            
        }finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIsAdmin()
    }, [user])

    return loading ? (
        <Loading />
    ) : isAdmin ? (
        <DashboardShell
            user={user}
            badgeLabel="Admin"
            topbarSubtitle="Manage stores, users, products, payouts & platform settings"
            rightSlot={
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950/40 transition"
                >
                    <HomeIcon size={14} className="sm:hidden" />
                    <span className="hidden sm:inline">Home</span>
                    <ArrowUpRightIcon size={14} className="hidden sm:inline" />
                </Link>
            }
            navItems={[
                { name: 'Dashboard',     href: '/admin',           icon: HomeIcon },
                { name: 'Home page',     href: '/admin/home',      icon: Images },
                { name: 'Orders',        href: '/admin/orders',    icon: PackageIcon },
                { name: 'Stores',        href: '/admin/stores',    icon: StoreIcon },
                { name: 'Store Applications', href: '/admin/approve',   icon: ShieldCheckIcon },
                { name: 'Users',         href: '/admin/users',     icon: UsersIcon },
                { name: 'Products',      href: '/admin/products',  icon: ShoppingBasketIcon },
                { name: 'Site Content',  href: '/admin/content',   icon: Images },
                { name: 'Coupons',       href: '/admin/coupons',   icon: TicketPercentIcon },
                { name: 'Payouts',       href: '/admin/payouts',   icon: CircleDollarSignIcon },
                { name: 'Refunds',       href: '/admin/refunds',   icon: RotateCcwIcon },
                { name: 'Settings',      href: '/admin/settings',  icon: SettingsIcon },
            ]}
            sidebarHeader={
                <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-400">
                        Admin Console
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {user?.fullName || "Admin"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-400 truncate">
                        Full access tools
                    </p>
                </div>
            }
        >
            {children}
        </DashboardShell>
    ) : (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">You are not authorized to access this page</h1>
            <Link href="/" className="bg-slate-700 text-white flex items-center gap-2 mt-8 p-2 px-6 max-sm:text-sm rounded-full">Go to home <ArrowRightIcon size={18} /></Link>
        </div>
    )
}

export default AdminLayout