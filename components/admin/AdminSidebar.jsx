'use client'

import { usePathname } from "next/navigation"
import { useRef } from "react"
import {
  HomeIcon,
  ShieldCheckIcon,
  StoreIcon,
  TicketPercentIcon,
  UsersIcon,
  CircleDollarSignIcon,
  SettingsIcon,
  RotateCcwIcon,
  ShoppingBasketIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"

const AdminSidebar = () => {
  const { user } = useUser()
  const pathname = usePathname()
  const sidebarRef = useRef(null)

  const scrollSidebar = (delta) => {
    if (!sidebarRef.current) return
    sidebarRef.current.scrollBy({ top: delta, behavior: "smooth" })
  }

  const sidebarLinks = [
    { name: "Dashboard", href: "/admin", icon: HomeIcon },
    { name: "Stores", href: "/admin/stores", icon: StoreIcon },
    { name: "Approve Store", href: "/admin/approve", icon: ShieldCheckIcon },
    { name: "Users", href: "/admin/users", icon: UsersIcon },
    { name: "Products", href: "/admin/products", icon: ShoppingBasketIcon },
    { name: "Coupons", href: "/admin/coupons", icon: TicketPercentIcon },
    { name: "Payouts", href: "/admin/payouts", icon: CircleDollarSignIcon },
    { name: "Refunds", href: "/admin/refunds", icon: RotateCcwIcon },
    { name: "Settings", href: "/admin/settings", icon: SettingsIcon },
  ]

  return (
    <aside className="relative flex h-dvh min-h-0 w-full sm:w-60 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
      <div className="flex flex-1 min-h-0 flex-col">
        <div className="flex shrink-0 flex-col items-center justify-center gap-3 pt-8 max-sm:hidden">
          {user && (
            <>
              <Image
                className="h-14 w-14 rounded-full"
                src={user.imageUrl}
                alt=""
                width={80}
                height={80}
              />
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {user.fullName}
              </p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                Admin
              </span>
            </>
          )}
        </div>

        <nav
          ref={sidebarRef}
          className="mt-6 flex-1 min-h-0 overflow-y-auto"
        >
          <div className="flex flex-col gap-1 pb-4">
            {sidebarLinks.map((link, index) => {
              const active = pathname === link.href

              return (
                <Link
                  key={index}
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
      </div>

      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => scrollSidebar(-180)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-sm transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronUpIcon size={18} />
        </button>
        <button
          type="button"
          onClick={() => scrollSidebar(180)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-sm transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronDownIcon size={18} />
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar
