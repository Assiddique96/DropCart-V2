'use client'
import { usePathname } from "next/navigation"
import { HomeIcon, LayoutListIcon, SquarePenIcon, SquarePlusIcon, CircleDollarSignIcon, UserCircleIcon, StoreIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ACTIVE_STORE_KEY } from "@/lib/storeAuthHeaders"

const StoreSidebar = ({storeInfo, stores = [], onStoreChange}) => {

    const pathname = usePathname()

    const sidebarLinks = [
        { name: 'Dashboard',       href: '/store',                icon: HomeIcon },
        { name: 'Add Product',     href: '/store/add-product',    icon: SquarePlusIcon },
        { name: 'Manage Product',  href: '/store/manage-product', icon: SquarePenIcon },
        { name: 'Orders',          href: '/store/orders',         icon: LayoutListIcon },
        { name: 'Payouts',         href: '/store/payouts',        icon: CircleDollarSignIcon },
        { name: 'Store Profile',   href: '/store/profile',        icon: UserCircleIcon },
        { name: 'My Stores',       href: '/store/stores',         icon: StoreIcon },
    ]

    return (
        <div className="inline-flex h-full flex-col gap-5 border-r border-slate-200 sm:min-w-60">
            <div className="flex flex-col gap-3 justify-center items-center pt-8 max-sm:hidden">
                <Image className="w-14 h-14 rounded-full shadow-md" src={storeInfo?.logo} alt="" width={80} height={80} />
                <p className="text-slate-700">{storeInfo?.name}</p>
            </div>
            {stores.length > 1 && (
                <div className="px-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Active Store</p>
                    <select
                        value={storeInfo?.id || ""}
                        onChange={(e) => {
                            localStorage.setItem(ACTIVE_STORE_KEY, e.target.value);
                            onStoreChange?.();
                        }}
                        className="w-full rounded-md border border-slate-200 text-xs p-2 bg-white text-slate-700"
                    >
                        {stores.map((store) => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="max-sm:mt-6">
                {
                    sidebarLinks.map((link, index) => (
                        <Link key={index} href={link.href} className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 transition ${pathname === link.href && 'bg-slate-100 sm:text-slate-600'}`}>
                            <link.icon size={18} className="sm:ml-5" />
                            <p className="max-sm:hidden">{link.name}</p>
                            {pathname === link.href && <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 sm:w-1.5 rounded-l"></span>}
                        </Link>
                    ))
                }
            </div>
        </div>
    )
}

export default StoreSidebar