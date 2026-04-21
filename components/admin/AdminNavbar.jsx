'use client'
import { useUser, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import ThemeToggle from "@/components/ThemeToggle"

const AdminNavbar = () => {

    const { user } = useUser()

    return (
        <div className="flex items-center justify-between px-6 sm:px-12 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 transition-all">
            <Link href="/" className="relative text-4xl font-semibold text-slate-700">
                <span className="text-gray-600 dark:text-slate-200">Drop</span>Cart<span className="text-gray-300 dark:text-slate-400 text-5xl leading-0">.</span>
                <p className="absolute text-xs font-semibold -top-1 -right-13 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-gray-500">
                    Admin
                </p>
            </Link>
            <div className="flex items-center gap-3">
                <ThemeToggle compact />
                <p className="text-slate-700 dark:text-slate-200">Hi, {user?.firstName}</p>
                <UserButton />
            </div>
        </div>
    )
}

export default AdminNavbar
