'use client'

import { usePathname } from "next/navigation"
import {
  HomeIcon,
  LayoutListIcon,
  SquarePenIcon,
  SquarePlusIcon,
  CircleDollarSignIcon,
  UserCircleIcon,
  StoreIcon
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ACTIVE_STORE_KEY } from "@/lib/storeAuthHeaders"

const StoreSidebar = ({ storeInfo, stores, onStoreChange }) => {
  const pathname = usePathname()

  const sidebarLinks = [
    { name: "Dashboard", href: "/store", icon: HomeIcon },
    { name: "Add Product", href: "/store/add-product", icon: SquarePlusIcon },
    { name: "Manage Product", href: "/store/manage-product", icon: SquarePenIcon },
    { name: "Orders", href: "/store/orders", icon: LayoutListIcon },
    { name: "Payouts", href: "/store/payouts", icon: CircleDollarSignIcon },
    { name: "Delivery Fee", href: "/store/delivery-fee", icon: CircleDollarSignIcon },
    { name: "Store Profile", href: "/store/profile", icon: UserCircleIcon },
    { name: "My Stores", href: "/store/stores", icon: StoreIcon },
  ]

  return (
    <aside className="relative flex h-screen w-60 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
      {/* Fixed header (store info + store selector) */}
      <div className="shrink-0">
        <div className="flex flex-col items-center justify-center gap-3 pt-8 max-sm:hidden">
          <Image
            className="h-14 w-14 rounded-full shadow-md"
            src={storeInfo?.logo || "/placeholder-store-logo.png"}
            alt={storeInfo?.name || "Store logo"}
            width={80}
            height={80}
          />
          <p className="text-slate-700 dark:text-slate-200">
            {storeInfo?.name}
          </p>
        </div>

        {stores && stores.length > 1 && (
          <div className="px-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Active Store
            </p>
            <select
              value={storeInfo?.id || ""}
              onChange={(e) => {
                localStorage.setItem(ACTIVE_STORE_KEY, e.target.value)
                onStoreChange?.()
              }}
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-700 dark:text-slate-200"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Scrollable links area */}
      <nav className="mt-6 flex-1 min-h-0 overflow-y-auto px-1">
        <div className="flex flex-col gap-1 pb-4">
          {sidebarLinks.map((link) => {
            const active = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-3 p-2.5 text-slate-500 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 ${
                  active
                    ? "bg-slate-100 dark:bg-slate-800 sm:text-slate-600 dark:sm:text-slate-100"
                    : ""
                }`}
              >
                <link.icon size={18} className="sm:ml-5" />
                <p className="max-sm:hidden">{link.name}</p>
                {active && (
                  <span className="absolute right-0 top-1.5 bottom-1.5 w-1 rounded-l bg-green-500 sm:w-1.5" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}

export default StoreSidebar
