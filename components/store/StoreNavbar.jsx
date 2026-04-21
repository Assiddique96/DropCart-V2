'use client'
import { useUser, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import ThemeToggle from "@/components/ThemeToggle"

const StoreNavbar = ({ activeStore }) => {

    const {user} = useUser()


    return (
        <div className="flex items-center justify-between px-6 sm:px-12 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 transition-all">
            <Link href="/" className="relative text-4xl font-semibold text-slate-400">
                <span className="text-gray-600 dark:text-slate-200">Drop</span>Cart<span className="text-gray-600 dark:text-slate-400 text-5xl leading-0">.</span>
                <p className="absolute text-xs font-semibold -top-1 -right-11 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-gray-500">
                    Store
                </p>
            </Link>
            <div className="flex items-center gap-3">
                <ThemeToggle compact />
                <div className="text-right leading-tight">
                    <p className="text-sm text-slate-700 dark:text-slate-200">Hi, {user?.firstName}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400">
                        Active: {activeStore?.name || "Store"}
                    </p>
                </div>
                <UserButton />
            </div>
        </div>
    )
}

export default StoreNavbar
