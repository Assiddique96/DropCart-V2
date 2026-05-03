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
        <div className="my-16 text-sm text-slate-600">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
                {['Description', `Reviews (${total})`].map((tab, i) => (
                    <button key={i}
                        className={`px-4 py-2.5 font-medium transition ${tab.startsWith(selectedTab.split(' ')[0]) ? 'border-b-2 border-slate-700 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                        onClick={() => setSelectedTab(tab.startsWith('Reviews') ? 'Reviews' : 'Description')}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Description tab */}
            {selectedTab === "Description" && (
                <p className="max-w-xl leading-7">{product.description}</p>
            )}

            {/* Reviews tab */}
            {selectedTab === "Reviews" && (
                <div className="max-w-2xl">
                    {/* Summary + breakdown */}
                    {total > 0 && (
                        <div className="flex gap-8 items-center mb-8 p-5 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-center shrink-0">
                                <p className="text-5xl font-bold text-slate-800">{avg.toFixed(1)}</p>
                                <StarDisplay value={Math.round(avg)} size={14} />
                                <p className="text-xs text-slate-400 mt-1">{total} review{total !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="flex-1 space-y-1.5">
                                {breakdown.map(({ label, count }) => (
                                    <StarRow key={label} label={label} count={count} total={total} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Individual reviews */}
                    {localRatings.length === 0 ? (
                        <p className="text-slate-400 py-8 text-center">No reviews yet. Be the first to review this product.</p>
                    ) : (
                        <div className="space-y-6">
                            {localRatings.map((item) => {
                                const isOwner = user?.id === item.userId
                                const isEditing = editingId === item.id
                                const isResponding = respondingId === item.id

                                return (
                                    <div key={item.id} className="border-b border-slate-100 pb-6">
                                        <div className="flex gap-4">
                                            <Image src={item.user?.image} alt="" className="size-10 rounded-full shrink-0 object-cover" width={40} height={40} />
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm">{item.user?.name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <StarDisplay value={item.rating} size={13} />
                                                            <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    {/* Owner actions */}
                                                    {isOwner && !isEditing && (
                                                        <div className="flex gap-1.5 shrink-0">
                                                            <button onClick={() => { setEditingId(item.id); setEditForm({ rating: item.rating, review: item.review }) }}
                                                                className="p-1 text-slate-400 hover:text-blue-500 transition" title="Edit review">
                                                                <PencilIcon size={13} />
                                                            </button>
                                                            <button onClick={() => deleteRating(item.id)}
                                                                className="p-1 text-slate-400 hover:text-red-500 transition" title="Delete review">
                                                                <Trash2Icon size={13} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Inline edit form */}
                                                {isEditing ? (
                                                    <div className="mt-3 space-y-2">
                                                        <div className="flex gap-1">
                                                            {[1,2,3,4,5].map(n => (
                                                                <button key={n} type="button" onClick={() => setEditForm(f => ({ ...f, rating: n }))}
                                                                    className="p-0.5">
                                                                    <StarIcon size={20} className="text-transparent"
                                                                        fill={editForm.rating >= n ? '#00C950' : '#D1D5DB'} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <textarea value={editForm.review} rows={3}
                                                            onChange={e => setEditForm(f => ({ ...f, review: e.target.value }))}
                                                            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none resize-none" />
                                                        <div className="flex gap-2">
                                                            <button onClick={() => saveEdit(item.id)} disabled={submitting}
                                                                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition disabled:opacity-50">
                                                                <CheckIcon size={12} /> {submitting ? 'Saving...' : 'Save'}
                                                            </button>
                                                            <button onClick={() => setEditingId(null)}
                                                                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">
                                                                <XIcon size={12} /> Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-sm mt-2 text-slate-600 leading-6">{item.review}</p>
                                                        {/* Review images */}
                                                        {item.reviewImages?.length > 0 && (
                                                            <div className="flex gap-2 mt-3 flex-wrap">
                                                                {item.reviewImages.map((src, imgIdx) => (
                                                                    <a key={imgIdx} href={src} target="_blank" rel="noopener noreferrer">
                                                                        <Image src={src} alt={`Review image ${imgIdx + 1}`}
                                                                            width={80} height={80}
                                                                            className="w-20 h-20 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition cursor-pointer" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {/* Seller response */}
                                                {item.sellerResponse && !isResponding && (
                                                    <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                                                <MessageSquareIcon size={11} /> Seller Response
                                                            </p>
                                                            {/* Seller can edit/delete their response */}
                                                            {product.store?.userId === user?.id && (
                                                                <div className="flex gap-1">
                                                                    <button onClick={() => { setRespondingId(item.id); setResponseText(item.sellerResponse) }}
                                                                        className="text-slate-400 hover:text-blue-500"><PencilIcon size={11} /></button>
                                                                    <button onClick={() => deleteResponse(item.id)}
                                                                        className="text-slate-400 hover:text-red-500"><Trash2Icon size={11} /></button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-600">{item.sellerResponse}</p>
                                                    </div>
                                                )}

                                                {/* Seller respond form */}
                                                {product.store?.userId === user?.id && !item.sellerResponse && !isResponding && (
                                                    <button onClick={() => { setRespondingId(item.id); setResponseText('') }}
                                                        className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition">
                                                        <MessageSquareIcon size={12} /> Reply to review
                                                    </button>
                                                )}

                                                {isResponding && (
                                                    <div className="mt-3 space-y-2">
                                                        <textarea value={responseText} rows={2}
                                                            onChange={e => setResponseText(e.target.value)}
                                                            placeholder="Write your response..."
                                                            className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none resize-none" />
                                                        <div className="flex gap-2">
                                                            <button onClick={() => saveResponse(item.id)} disabled={submitting}
                                                                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition disabled:opacity-50">
                                                                <CheckIcon size={12} /> {submitting ? 'Saving...' : 'Post Response'}
                                                            </button>
                                                            <button onClick={() => setRespondingId(null)}
                                                                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">
                                                                <XIcon size={12} /> Cancel
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

            {/* Store info */}
            <div className="flex gap-3 mt-14">
                {product.store?.logo ? (
                    <Image src={product.store.logo} alt={product.store.name}
                        className="size-11 rounded-full ring ring-slate-200 object-cover" width={44} height={44} />
                ) : (
                    <div className="size-11 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold ring ring-slate-200 uppercase">
                        {product.store?.name?.charAt(0) || "S"}
                    </div>
                )}
                <div>
                    <p className="font-medium text-slate-700">Product by {product.store?.name || "Unknown Store"}</p>
                    <Link href={`/shop/${product.store?.username || "#"}`}
                        className="flex items-center gap-1.5 text-green-500 text-sm">
                        View store <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    )
}
