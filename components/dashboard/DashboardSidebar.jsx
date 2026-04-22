'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"

const DashboardSidebar = ({ navItems = [], header, user, onNavigate }) => {
  const pathname = usePathname()

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-slate-200/70 dark:border-slate-800/80">
        {header ? (
          header
        ) : (
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Dashboard
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {user?.fullName || "Account"}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onNavigate?.()}
                className={[
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition",
                  "text-sm text-slate-600 dark:text-slate-300",
                  "hover:bg-slate-100/80 dark:hover:bg-slate-900/60",
                  isActive
                    ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex items-center justify-center w-9 h-9 rounded-lg border transition",
                    isActive
                      ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                      : "border-transparent bg-transparent group-hover:border-slate-200/60 dark:group-hover:border-slate-800/80",
                  ].join(" ")}
                >
                  {Icon ? <Icon size={18} /> : null}
                </span>
                <span className="truncate">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200/70 dark:border-slate-800/80">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
          Secure admin & seller tools for managing stores, products, orders, and payouts.
        </p>
      </div>
    </div>
  )
}

export default DashboardSidebar

