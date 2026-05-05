'use client'
import { ArrowRight, StarIcon, PencilIcon, Trash2Icon, MessageSquareIcon, CheckIcon, XIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { useSelector } from "react-redux"
import axios from "axios"
import toast from "react-hot-toast"

const StarRow = ({ count, total, label }) => (
    <div className="flex items-center gap-2 text-xs">
        <span className="w-3 text-slate-400">{label}★</span>
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full transition-all"
                style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }} />
        </div>
        <span className="w-4 text-slate-400 text-right">{count}</span>
    </div>
)

const StarDisplay = ({ value, size = 16 }) => (
    <div className="flex">
        {Array(5).fill('').map((_, i) => (
            <StarIcon key={i} size={size} className="text-transparent"
                fill={value >= i + 1 ? "#00C950" : "#D1D5DB"} />
        ))}
    </div>
)

export default function ProductDescription({ product }) {
    const [selectedTab, setSelectedTab] = useState('Description')
    const { user } = useUser()
    const { getToken } = useAuth()
    const userRatings = useSelector(state => state.rating.ratings)

    // Per-review edit/response state
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({ rating: 0, review: '' })
    const [respondingId, setRespondingId] = useState(null)
    const [responseText, setResponseText] = useState('')
    const [localRatings, setLocalRatings] = useState(product.rating || [])
    const [submitting, setSubmitting] = useState(false)

    // Rating breakdown
    const total = localRatings.length
    const avg = total > 0 ? (localRatings.reduce((s, r) => s + r.rating, 0) / total) : 0
    const breakdown = [5, 4, 3, 2, 1].map(n => ({
        label: n,
        count: localRatings.filter(r => r.rating === n).length,
    }))

    const saveEdit = async (ratingId) => {
        setSubmitting(true)
        try {
            const token = await getToken()
            const { data } = await axios.patch('/api/rating',
                { ratingId, rating: editForm.rating, review: editForm.review },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setLocalRatings(prev => prev.map(r => r.id === ratingId ? { ...r, ...data.rating } : r))
            setEditingId(null)
            toast.success("Review updated.")
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
        setSubmitting(false)
    }

    const deleteRating = async (ratingId) => {
        if (!window.confirm("Delete your review?")) return
        try {
            const token = await getToken()
            await axios.delete(`/api/rating?ratingId=${ratingId}`, { headers: { Authorization: `Bearer ${token}` } })
            setLocalRatings(prev => prev.filter(r => r.id !== ratingId))
            toast.success("Review deleted.")
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
    }

    const saveResponse = async (ratingId) => {
        setSubmitting(true)
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/store/review-response',
                { ratingId, response: responseText },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setLocalRatings(prev => prev.map(r => r.id === ratingId ? { ...r, sellerResponse: data.rating.sellerResponse } : r))
            setRespondingId(null)
            setResponseText('')
            toast.success("Response saved.")
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
        setSubmitting(false)
    }

    const deleteResponse = async (ratingId) => {
        try {
            const token = await getToken()
            await axios.delete(`/api/store/review-response?ratingId=${ratingId}`, { headers: { Authorization: `Bearer ${token}` } })
            setLocalRatings(prev => prev.map(r => r.id === ratingId ? { ...r, sellerResponse: null } : r))
            toast.success("Response removed.")
        } catch (e) { toast.error(e?.response?.data?.error || e.message) }
    }

    return (
        <div className="my-16 space-y-10 text-slate-600">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-3xl space-y-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Product overview</p>
                        <h2 className="text-3xl font-semibold text-slate-900">Product highlights</h2>
                        <p className="leading-7 text-slate-700">{product.description}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Category</p>
                            <p className="mt-2 font-semibold text-slate-900">{product.category || 'Others'}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Manufacturer</p>
                            <p className="mt-2 font-semibold text-slate-900">{product.manufacturer || 'Not specified'}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Material</p>
                            <p className="mt-2 font-semibold text-slate-900">{product.material || 'Not specified'}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Origin</p>
                            <p className="mt-2 font-semibold text-slate-900">{product.madeIn || 'Unknown'}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Guarantee</p>
                            <p className="mt-2 font-semibold text-slate-900">{product.guaranteePeriod || 'Not specified'}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Shipping</p>
                            <p className="mt-2 font-semibold text-slate-900">{product.origin === 'ABROAD' ? 'International' : 'Local'}</p>
                        </div>
                    </div>
                </div>

                {product.tags?.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                        {product.tags.map(tag => (
                            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-wrap gap-2 bg-slate-50 p-4">
                    {['Description', `Reviews (${total})`].map((tab, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedTab(tab.startsWith('Reviews') ? 'Reviews' : 'Description')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab.startsWith(selectedTab.split(' ')[0]) ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {selectedTab === "Description" && (
                        <div className="space-y-8">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Category</p>
                                    <p className="mt-2 font-semibold text-slate-900">{product.category || 'Others'}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Manufacturer</p>
                                    <p className="mt-2 font-semibold text-slate-900">{product.manufacturer || 'Not specified'}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Material</p>
                                    <p className="mt-2 font-semibold text-slate-900">{product.material || 'Not specified'}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Origin</p>
                                    <p className="mt-2 font-semibold text-slate-900">{product.madeIn || 'Unknown'}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Guarantee</p>
                                    <p className="mt-2 font-semibold text-slate-900">{product.guaranteePeriod || 'Not specified'}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Shipping</p>
                                    <p className="mt-2 font-semibold text-slate-900">{product.origin === 'ABROAD' ? 'International' : 'Local'}</p>
                                </div>
                            </div>

                            <div className="prose prose-sm max-w-none text-slate-700">
                                <p>{product.description}</p>
                            </div>
                        </div>
                    )}

                    {selectedTab === "Reviews" && (
                        <div className="space-y-8">
                            {total > 0 ? (
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                                        <div className="text-center lg:text-left">
                                            <p className="text-5xl font-bold text-slate-900">{avg.toFixed(1)}</p>
                                            <div className="flex justify-center lg:justify-start mt-2">
                                                <StarDisplay value={Math.round(avg)} size={14} />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{total} review{total !== 1 ? 's' : ''}</p>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {breakdown.map(({ label, count }) => (
                                                <StarRow key={label} label={label} count={count} total={total} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center text-slate-500">
                                    No reviews yet. Be the first to share your experience.
                                </div>
                            )}

                            {localRatings.length > 0 && (
                                <div className="space-y-6">
                                    {localRatings.map((item) => {
                                        const isOwner = user?.id === item.userId
                                        const isEditing = editingId === item.id
                                        const isResponding = respondingId === item.id

                                        return (
                                            <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                                                <div className="flex gap-4">
                                                    <Image src={item.user?.image} alt="" className="size-10 rounded-full shrink-0 object-cover" width={40} height={40} />
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div>
                                                                <p className="font-semibold text-slate-900 text-sm">{item.user?.name}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <StarDisplay value={item.rating} size={13} />
                                                                    <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                            {isOwner && !isEditing && (
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => { setEditingId(item.id); setEditForm({ rating: item.rating, review: item.review }) }}
                                                                        className="text-slate-400 hover:text-blue-500 transition" title="Edit review">
                                                                        <PencilIcon size={14} />
                                                                    </button>
                                                                    <button onClick={() => deleteRating(item.id)}
                                                                        className="text-slate-400 hover:text-red-500 transition" title="Delete review">
                                                                        <Trash2Icon size={14} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {isEditing ? (
                                                            <div className="mt-4 space-y-3">
                                                                <div className="flex gap-1">
                                                                    {[1,2,3,4,5].map(n => (
                                                                        <button key={n} type="button" onClick={() => setEditForm(f => ({ ...f, rating: n }))}
                                                                            className="p-0.5">
                                                                            <StarIcon size={20} className="text-transparent" fill={editForm.rating >= n ? '#00C950' : '#D1D5DB'} />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <textarea value={editForm.review} rows={3}
                                                                    onChange={e => setEditForm(f => ({ ...f, review: e.target.value }))}
                                                                    className="w-full border border-slate-200 rounded-2xl p-3 text-sm outline-none resize-none" />
                                                                <div className="flex flex-wrap gap-2">
                                                                    <button onClick={() => saveEdit(item.id)} disabled={submitting}
                                                                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50">
                                                                        <CheckIcon size={14} /> {submitting ? 'Saving...' : 'Save'}
                                                                    </button>
                                                                    <button onClick={() => setEditingId(null)}
                                                                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 transition">
                                                                        <XIcon size={14} /> Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="mt-4 text-slate-700 leading-7">{item.review}</p>
                                                                {item.reviewImages?.length > 0 && (
                                                                    <div className="mt-4 grid grid-cols-3 gap-3">
                                                                        {item.reviewImages.map((src, imgIdx) => (
                                                                            <a key={imgIdx} href={src} target="_blank" rel="noopener noreferrer">
                                                                                <Image src={src} alt={`Review image ${imgIdx + 1}`} width={80} height={80}
                                                                                    className="h-20 w-full rounded-2xl object-cover border border-slate-200" />
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}

                                                        {item.sellerResponse && !isResponding && (
                                                            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
                                                                <div className="flex items-center justify-between gap-3 mb-2">
                                                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                                                        <MessageSquareIcon size={12} /> Seller Response
                                                                    </p>
                                                                    {product.store?.userId === user?.id && (
                                                                        <div className="flex gap-2 text-slate-400">
                                                                            <button onClick={() => { setRespondingId(item.id); setResponseText(item.sellerResponse) }} className="hover:text-blue-500 transition"><PencilIcon size={14} /></button>
                                                                            <button onClick={() => deleteResponse(item.id)} className="hover:text-red-500 transition"><Trash2Icon size={14} /></button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-slate-700">{item.sellerResponse}</p>
                                                            </div>
                                                        )}

                                                        {product.store?.userId === user?.id && !item.sellerResponse && !isResponding && (
                                                            <button onClick={() => { setRespondingId(item.id); setResponseText('') }}
                                                                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition">
                                                                <MessageSquareIcon size={14} /> Reply to review
                                                            </button>
                                                        )}

                                                        {isResponding && (
                                                            <div className="mt-4 space-y-3">
                                                                <textarea value={responseText} rows={3}
                                                                    onChange={e => setResponseText(e.target.value)}
                                                                    placeholder="Write your response..."
                                                                    className="w-full border border-slate-200 rounded-2xl p-3 text-sm outline-none resize-none" />
                                                                <div className="flex flex-wrap gap-2">
                                                                    <button onClick={() => saveResponse(item.id)} disabled={submitting}
                                                                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50">
                                                                        <CheckIcon size={14} /> {submitting ? 'Saving...' : 'Post Response'}
                                                                    </button>
                                                                    <button onClick={() => setRespondingId(null)}
                                                                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 transition">
                                                                        <XIcon size={14} /> Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    {product.store?.logo ? (
                        <Image src={product.store.logo} alt={product.store.name}
                            className="size-11 rounded-full ring ring-slate-200 object-cover" width={44} height={44} />
                    ) : (
                        <div className="size-11 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold ring ring-slate-200 uppercase">
                            {product.store?.name?.charAt(0) || "S"}
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-slate-900">Product by {product.store?.name || "Unknown Store"}</p>
                        <p className="text-sm text-slate-500">Trusted seller with verified store ratings.</p>
                    </div>
                </div>
                <div className="mt-5">
                    <Link href={`/shop/${product.store?.username || "#"}`}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition">
                        View store <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    )
}
