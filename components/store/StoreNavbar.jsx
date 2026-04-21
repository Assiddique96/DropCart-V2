'use client'
import { useUser, UserButton } from "@clerk/nextjs"
import Link from "next/link"

const StoreNavbar = ({ activeStore }) => {

    const {user} = useUser()


    return (
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 transition-all">
            <Link href="/" className="relative text-4xl font-semibold text-slate-400">
                <span className="text-gray-600">Drop</span>Cart<span className="text-gray-600 text-5xl leading-0">.</span>
                <p className="absolute text-xs font-semibold -top-1 -right-11 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-gray-500">
                    Store
                </p>
            </Link>
            <div className="flex items-center gap-3">
                <div className="text-right leading-tight">
                    <p className="text-sm">Hi, {user?.firstName}</p>
                    <p className="text-[11px] text-slate-400">
                        Active: {activeStore?.name || "Store"}
                    </p>
                </div>
                <UserButton />
            </div>
        </div>
    )
}

export default StoreNavbar
