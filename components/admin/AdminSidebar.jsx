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
  ChevronDownIcon 
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
    sidebarRef.current.scrollBy({ top: delta, behavior: 'smooth' })
  }

  const sidebarLinks = [
    { name: 'Dashboard',     href: '/admin',           icon: HomeIcon },
    { name: 'Stores',        href: '/admin/stores',    icon: StoreIcon },
    { name: 'Approve Store', href: '/admin/approve',   icon: ShieldCheckIcon },
    { name: 'Users',         href: '/admin/users',     icon: UsersIcon },
    { name: 'Products',      href: '/admin/products',  icon: ShoppingBasketIcon },
    { name: 'Coupons',       href: '/admin/coupons',   icon: TicketPercentIcon },
    { name: 'Payouts',       href: '/admin/payouts',   icon: CircleDollarSignIcon },
    { name: 'Refunds',       href: '/admin/refunds',   icon: RotateCcwIcon },
    { name: 'Settings',      href: '/admin/settings',  icon: SettingsIcon },
  ]

  return (
    <div className="relative inline-flex h-full min-h-0 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 sm:min-w-60">
      <div ref={sidebarRef} className="min-h-0 overflow-y-auto flex-1 flex flex-col gap-5">
        <div className="flex flex-col gap-3 justify-center items-center pt-8 max-sm:hidden">
          {user && (
            <>
              <Image className="w-14 h-14 rounded-full" src={user.imageUrl} alt="" width={80} height={80} />
              <p className="text-slate-700 dark:text-slate-200 text-sm">{user.fullName}</p>
              <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-full">Admin</span>
            </>
          )}
        </div>

        <div className="max-sm:mt-6">
          {sidebarLinks.map((link, index) => (
            <Link 
              key={index} 
              href={link.href}
              className={`relative flex items-center gap-3 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 p-2.5 transition ${pathname === link.href ? 'bg-slate-100 dark:bg-slate-800 sm:text-slate-600 dark:sm:text-slate-100' : ''}`}
            >
              <link.icon size={18} className="sm:ml-5" />
              <p className="max-sm:hidden">{link.name}</p>
              {pathname === link.href && (
                <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 sm:w-1.5 rounded-l"></span>
              )}
            </Link>
          ))}
        </div>
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
    </div>
  )
}

export default AdminSidebar
