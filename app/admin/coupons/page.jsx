'use client'
import { useEffect, useState } from "react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { Trash2Icon, InfinityIcon } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"

const Toggle = ({ checked, onChange, label }) => (
    <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-500 transition-colors duration-200"></div>
            <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
        </div>
        <span className="text-sm">{label}</span>
    </label>
)

export default function AdminCoupons() {
    const { getToken } = useAuth()
    const [coupons, setCoupons] = useState([])
    const [newCoupon, setNewCoupon] = useState({
        code: '', description: '', discount: '', forNewUser: false,
        forMember: false, isPublic: false, expiresAt: new Date(), maxUses: '',
    })
    const [confirmDelete, setConfirmDelete] = useState(null)

    const fetchCoupons = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get("/api/admin/coupon", { headers: { Authorization: `Bearer ${token}` } })
            setCoupons(data.coupons)
        } catch (e) { toast.error(e?.response?.data?.message || e.message) }
    }

    const handleAddCoupon = async (e) => {
        e.preventDefault()
        try {
            const token = await getToken()
            const payload = {
                ...newCoupon,
                discount: Number(newCoupon.discount),
                expiresAt: new Date(newCoupon.expiresAt),
                maxUses: newCoupon.maxUses ? parseInt(newCoupon.maxUses) : null,
            }
            const { data } = await axios.post("/api/admin/coupon", { coupon: payload }, { headers: { Authorization: `Bearer ${token}` } })
            toast.success(data.message)
            setNewCoupon({ code: '', description: '', discount: '', forNewUser: false, forMember: false, isPublic: false, expiresAt: new Date(), maxUses: '' })
            fetchCoupons()
        } catch (e) { toast.error(e?.response?.data?.message || e.message) }
    }

    const deleteCoupon = async (code) => {
        try {
            const token = await getToken()
            await axios.delete(`/api/admin/coupon?code=${encodeURIComponent(code)}`, { headers: { Authorization: `Bearer ${token}` } })
            toast.success("Coupon deleted")
            setConfirmDelete(null)
            fetchCoupons()
        } catch (e) { toast.error(e?.response?.data?.message || e.message) }
    }

    useEffect(() => { fetchCoupons() }, [])

    return (
        <div className="text-slate-500 mb-40">
            {/* Add Coupon */}
            <form onSubmit={e => toast.promise(handleAddCoupon(e), { loading: "Adding coupon..." })} className="max-w-lg text-sm">
                <h2 className="text-2xl mb-4">Add <span className="text-slate-800 font-medium">Coupon</span></h2>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">Coupon Code *</label>
                        <input type="text" placeholder="e.g. SAVE20" required
                            className="w-full p-2.5 border border-slate-200 outline-slate-400 rounded-lg text-sm uppercase"
                            value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">Discount % *</label>
                        <input type="number" placeholder="e.g. 20" min={1} max={100} required
                            className="w-full p-2.5 border border-slate-200 outline-slate-400 rounded-lg text-sm"
                            value={newCoupon.discount} onChange={e => setNewCoupon({ ...newCoupon, discount: e.target.value })} />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="text-xs text-slate-400 mb-1 block">Description *</label>
                    <input type="text" placeholder="Short description for the coupon" required
                        className="w-full p-2.5 border border-slate-200 outline-slate-400 rounded-lg text-sm"
                        value={newCoupon.description} onChange={e => setNewCoupon({ ...newCoupon, description: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">Expiry Date *</label>
                        <input type="date" required
                            className="w-full p-2.5 border border-slate-200 outline-slate-400 rounded-lg text-sm"
                            value={format(new Date(newCoupon.expiresAt), 'yyyy-MM-dd')}
                            onChange={e => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">Max Uses <span className="text-slate-300">(blank = unlimited)</span></label>
                        <input type="number" min={1} placeholder="e.g. 100"
                            className="w-full p-2.5 border border-slate-200 outline-slate-400 rounded-lg text-sm"
                            value={newCoupon.maxUses} onChange={e => setNewCoupon({ ...newCoupon, maxUses: e.target.value })} />
                    </div>
                </div>

                <div className="flex flex-wrap gap-5 mb-5 mt-4">
                    <Toggle checked={newCoupon.forNewUser} label="New Users Only"
                        onChange={e => setNewCoupon({ ...newCoupon, forNewUser: e.target.checked })} />
                    <Toggle checked={newCoupon.forMember} label="Members Only"
                        onChange={e => setNewCoupon({ ...newCoupon, forMember: e.target.checked })} />
                    <Toggle checked={newCoupon.isPublic} label="Public"
                        onChange={e => setNewCoupon({ ...newCoupon, isPublic: e.target.checked })} />
                </div>

                <button className="px-8 py-2.5 rounded-lg bg-slate-700 text-white hover:bg-slate-800 active:scale-95 transition text-sm">
                    Add Coupon
                </button>
            </form>

            {/* List Coupons */}
            <div className="mt-12">
                <h2 className="text-2xl mb-4">All <span className="text-slate-800 font-medium">Coupons</span></h2>
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm max-w-5xl">
                    <table className="w-full bg-white text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="py-3 px-4 text-left">Code</th>
                                <th className="py-3 px-4 text-left">Discount</th>
                                <th className="py-3 px-4 text-left">Uses</th>
                                <th className="py-3 px-4 text-left hidden md:table-cell">Expires</th>
                                <th className="py-3 px-4 text-left hidden lg:table-cell">Flags</th>
                                <th className="py-3 px-4 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {coupons.map(coupon => {
                                const isExpired = new Date(coupon.expiresAt) < new Date()
                                const isExhausted = coupon.maxUses !== null && coupon.usageCount >= coupon.maxUses
                                return (
                                    <tr key={coupon.code} className={`hover:bg-slate-50 ${isExpired || isExhausted ? 'opacity-60' : ''}`}>
                                        <td className="py-3 px-4">
                                            <span className="font-mono font-semibold text-slate-800">{coupon.code}</span>
                                            {coupon.description && <p className="text-xs text-slate-400 truncate max-w-[140px]">{coupon.description}</p>}
                                        </td>
                                        <td className="py-3 px-4 font-medium text-green-700">{coupon.discount}%</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-xs font-medium ${isExhausted ? 'text-red-500' : 'text-slate-700'}`}>
                                                    {coupon.usageCount}
                                                </span>
                                                <span className="text-slate-300">/</span>
                                                {coupon.maxUses === null
                                                    ? <InfinityIcon size={13} className="text-slate-400" />
                                                    : <span className="text-xs text-slate-400">{coupon.maxUses}</span>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 hidden md:table-cell">
                                            <span className={`text-xs ${isExpired ? 'text-red-400' : 'text-slate-500'}`}>
                                                {format(new Date(coupon.expiresAt), 'dd MMM yyyy')}
                                                {isExpired && ' (Expired)'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 hidden lg:table-cell">
                                            <div className="flex gap-1 flex-wrap">
                                                {coupon.forNewUser && <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">New User</span>}
                                                {coupon.forMember && <span className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">Member</span>}
                                                {coupon.isPublic && <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-600 rounded">Public</span>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button onClick={() => setConfirmDelete(coupon.code)}
                                                className="text-red-400 hover:text-red-600 transition" title="Delete coupon">
                                                <Trash2Icon size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {coupons.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No coupons yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {confirmDelete && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Delete coupon <span className="font-mono">{confirmDelete}</span>?</h3>
                        <p className="text-sm text-slate-500 mb-4">This cannot be undone. Active users with this code will no longer be able to use it.</p>
                        <div className="flex gap-3">
                            <button onClick={() => toast.promise(deleteCoupon(confirmDelete), { loading: "Deleting..." })}
                                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition">Delete</button>
                            <button onClick={() => setConfirmDelete(null)}
                                className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-200 transition">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
