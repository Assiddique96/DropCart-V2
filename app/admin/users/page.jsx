'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import Image from "next/image"
import { SearchIcon, ShieldOffIcon, ShieldCheckIcon, StoreIcon, XIcon } from "lucide-react"

export default function AdminUsers() {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [banModal, setBanModal] = useState(null)
    const [banReason, setBanReason] = useState('')
    const [actioning, setActioning] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350)
        return () => clearTimeout(t)
    }, [search])

    useEffect(() => { setPage(1) }, [debouncedSearch])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const token = await getToken()
            const { data } = await axios.get(
                `/api/admin/users?search=${encodeURIComponent(debouncedSearch)}&page=${page}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setUsers(data.users)
            setTotal(data.total)
            setTotalPages(data.totalPages)
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
        setLoading(false)
    }

    useEffect(() => { fetchUsers() }, [debouncedSearch, page])

    const handleBanAction = async () => {
        if (!banModal) return
        setActioning(true)
        try {
            const token = await getToken()
            const { data } = await axios.patch("/api/admin/users", {
                userId: banModal.user.id,
                action: banModal.action,
                reason: banReason,
            }, { headers: { Authorization: `Bearer ${token}` } })
            toast.success(data.message)
            setBanModal(null)
            setBanReason('')
            fetchUsers()
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
        setActioning(false)
    }

    return (
        <div className="text-slate-500 mb-28">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl">User <span className="text-slate-800 font-medium">Management</span></h1>
                    <p className="text-xs text-slate-400 mt-0.5">{total} total users</p>
                </div>
                <div className="relative">
                    <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-sm outline-none w-60" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><XIcon size={13} /></button>}
                </div>
            </div>

            {loading ? <Loading /> : (
                <>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3 hidden md:table-cell">Email</th>
                                    <th className="px-4 py-3 hidden lg:table-cell">Orders</th>
                                    <th className="px-4 py-3 hidden lg:table-cell">Store</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {users.map(user => (
                                    <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${user.isBanned ? 'bg-red-50/40' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Image src={user.image} alt="" width={32} height={32} className="rounded-full" />
                                                <span className="font-medium text-slate-800 truncate max-w-[120px]">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell text-slate-400 text-xs">{user.email}</td>
                                        <td className="px-4 py-3 hidden lg:table-cell">{user._count?.buyerOrders ?? 0}</td>
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            {user.store ? (
                                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${user.store.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    <StoreIcon size={11} /> {user.store.name}
                                                </span>
                                            ) : <span className="text-slate-300 text-xs">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.isBanned ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-700'}`}>
                                                {user.isBanned ? 'Banned' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.isBanned ? (
                                                <button onClick={() => { setBanModal({ user, action: 'unban' }); setBanReason('') }}
                                                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 transition">
                                                    <ShieldCheckIcon size={13} /> Unban
                                                </button>
                                            ) : (
                                                <button onClick={() => { setBanModal({ user, action: 'ban' }); setBanReason('') }}
                                                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition">
                                                    <ShieldOffIcon size={13} /> Ban
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">No users found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-lg text-sm transition ${page === p ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {banModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">
                            {banModal.action === 'ban' ? `Ban ${banModal.user.name}?` : `Unban ${banModal.user.name}?`}
                        </h3>
                        {banModal.action === 'ban' ? (
                            <>
                                <p className="text-sm text-slate-500 mb-3">This will suspend their account and deactivate their store.</p>
                                <textarea value={banReason} onChange={e => setBanReason(e.target.value)}
                                    placeholder="Reason for ban (optional)" rows={3}
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none resize-none mb-4" />
                            </>
                        ) : (
                            <p className="text-sm text-slate-500 mb-4">Their account access will be restored. Store remains inactive until manually re-enabled.</p>
                        )}
                        <div className="flex gap-3">
                            <button onClick={handleBanAction} disabled={actioning}
                                className={`flex-1 py-2 rounded-lg text-white text-sm disabled:opacity-50 ${banModal.action === 'ban' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'} transition`}>
                                {actioning ? "Processing..." : banModal.action === 'ban' ? "Confirm Ban" : "Confirm Unban"}
                            </button>
                            <button onClick={() => setBanModal(null)}
                                className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 transition">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
