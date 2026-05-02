'use client'
import { useMemo, useState } from "react"
import { MenuIcon, XIcon } from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"
import { UserButton } from "@clerk/nextjs"
import DashboardSidebar from "./DashboardSidebar"

const DashboardShell = ({
  children,
  user,
  badgeLabel,
  navItems,
  sidebarHeader,
  topbarSubtitle,
  rightSlot,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const greeting = useMemo(() => {
    const first = user?.firstName || user?.fullName?.split(" ")?.[0]
    return first ? `Hi, ${first}` : "Welcome"
  }, [user])

  return (
    <div className="panel-theme min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Topbar */}
      <div className="sticky top-0 z-40 border-b border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="h-16 px-4 sm:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              aria-label="Open menu"
            >
              <MenuIcon size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  Shpinx..
                </p>
                {badgeLabel && (
                  <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shrink-0">
                    {badgeLabel}
                  </span>
                )}
              </div>
              {topbarSubtitle && (
                <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                  {topbarSubtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {rightSlot}
            <ThemeToggle compact />
            <p className="hidden sm:block text-sm text-slate-600 dark:text-slate-200">
              {greeting}
            </p>
            <UserButton />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden sm:block sticky top-16 h-[calc(100vh-4rem)] w-72 shrink-0 border-r border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-950">
          <DashboardSidebar
            user={user}
            navItems={navItems}
            header={sidebarHeader}
          />
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="sm:hidden fixed inset-0 z-50">
            <button
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu overlay"
            />
            <div className="absolute left-0 top-0 bottom-0 w-[82vw] max-w-[320px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Menu
                </p>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                  aria-label="Close menu"
                >
                  <XIcon size={18} />
                </button>
              </div>
              <DashboardSidebar
                user={user}
                navItems={navItems}
                header={sidebarHeader}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="px-4 sm:px-10 py-6 sm:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardShell

