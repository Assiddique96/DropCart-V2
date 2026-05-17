'use client'
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import { CheckCircleIcon, XCircleIcon, ClockIcon, AlertCircleIcon, DownloadIcon } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import axios from "axios"
import Image from "next/image"

export default function AdminVerifyStores() {
    const { user } = useUser()
    const { getToken } = useAuth()
    const [stores, setStores] = useState([])
    const [counts, setCounts] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 })
    const [statusFilter, setStatusFilter] = useState("pending")
    const [loading, setLoading] = useState(true)
    const [approving, setApproving] = useState({})
    const [rejectingId, setRejectingId] = useState(null)
    const [rejectReason, setRejectReason] = useState("")
    const [selectedStore, setSelectedStore] = useState(null)
    const [showPreview, setShowPreview] = useState(false)

    const fetchStores = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get("/api/admin/verify-stores", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setStores(data.stores || [])
            setCounts(data.counts || { total: 0, pending: 0, verified: 0, rejected: 0 })
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
        setLoading(false)
    }

    useEffect(() => {
        if (user) {
            fetchStores()
        }
    }, [user])

    const filteredStores = statusFilter === "all"
        ? stores
        : stores.filter((store) => store.verificationStatus === statusFilter)

    const handleApprove = async (storeId) => {
        if (!confirm("Approve this store's verification?")) return

        setApproving(prev => ({ ...prev, [storeId]: true }))
        try {
            const token = await getToken()
            await axios.post(
                "/api/admin/approve-store-verification",
                { storeId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
            toast.success("Store verification approved")
            await fetchStores()
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        } finally {
            setApproving(prev => ({ ...prev, [storeId]: false }))
        }
    }

    const handleRejectSubmit = async (storeId) => {
        if (!rejectReason.trim()) {
            toast.error("Please provide a rejection reason")
            return
        }

        setRejectingId(storeId)
        try {
            const token = await getToken()
            await axios.post(
                "/api/admin/reject-store-verification",
                { storeId, reason: rejectReason },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
            toast.success("Store verification rejected")
            await fetchStores()
            setRejectingId(null)
            setRejectReason("")
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 dark:text-slate-300 mb-28">
            <h1 className="text-2xl">Store <span className="text-slate-800 dark:text-slate-100 font-medium">Verification</span></h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-6">Review and approve seller store verification requests</p>

            <div className="mt-4 flex flex-wrap gap-2 text-sm mb-6">
                {[
                    { key: "pending", label: `Pending (${counts.pending})`, color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" },
                    { key: "verified", label: `Verified (${counts.verified})`, color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" },
                    { key: "rejected", label: `Rejected (${counts.rejected})`, color: "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800" },
                    { key: "all", label: `All (${counts.total})`, color: "" },
                ].map((item) => (
                    <button
                        key={item.key}
                        onClick={() => setStatusFilter(item.key)}
                        className={`px-3 py-1.5 rounded-full border transition ${
                            statusFilter === item.key
                                ? `${item.color} font-semibold`
                                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {filteredStores.length ? (
                <div className="flex flex-col gap-4">
                    {filteredStores.map((store) => (
                        <div key={store.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 space-y-4 max-w-4xl">
                            {/* Store Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{store.name}</h3>
                                        {store.verificationStatus === "verified" && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                                                <CheckCircleIcon className="w-3 h-3" />
                                                Verified
                                            </span>
                                        )}
                                        {store.verificationStatus === "pending" && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-200">
                                                <ClockIcon className="w-3 h-3" />
                                                Pending
                                            </span>
                                        )}
                                        {store.verificationStatus === "rejected" && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-full text-xs font-semibold text-rose-700 dark:text-rose-200">
                                                <XCircleIcon className="w-3 h-3" />
                                                Rejected
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Email: {store.email} | Contact: {store.contact}
                                    </p>
                                </div>
                            </div>

                            {/* Verification Details */}
                            <div className="bg-slate-50 dark:bg-slate-950/30 rounded-lg p-4 space-y-3 text-sm">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">CAC Number</p>
                                        <p className="text-slate-800 dark:text-slate-100 mt-1">{store.cacNumber || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Document Type</p>
                                        <p className="text-slate-800 dark:text-slate-100 mt-1">{store.verificationDocumentType || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Document Number</p>
                                        <p className="text-slate-800 dark:text-slate-100 mt-1">{store.verificationDocumentNumber || "—"}</p>
                                    </div>
                                </div>

                                {/* Document Preview */}
                                <div className="grid grid-cols-2 gap-4">
                                    {store.verificationDocumentUrl && (
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Document Image</p>
                                            <button
                                                onClick={() => {
                                                    setSelectedStore(store)
                                                    setShowPreview(true)
                                                }}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition"
                                            >
                                                <DownloadIcon className="w-3.5 h-3.5" />
                                                View Document
                                            </button>
                                        </div>
                                    )}
                                    {store.facialVerificationUrl && (
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Selfie</p>
                                            <button
                                                onClick={() => {
                                                    setSelectedStore({ ...store, preview: 'selfie' })
                                                    setShowPreview(true)
                                                }}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition"
                                            >
                                                <DownloadIcon className="w-3.5 h-3.5" />
                                                View Selfie
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {store.verificationRejectedReason && (
                                    <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-lg p-3 mt-3">
                                        <p className="text-xs font-semibold text-rose-700 dark:text-rose-200 mb-1">Rejection Reason:</p>
                                        <p className="text-rose-900 dark:text-rose-100 text-sm">{store.verificationRejectedReason}</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {store.verificationStatus === "pending" && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                        onClick={() => handleApprove(store.id)}
                                        disabled={approving[store.id]}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                                    >
                                        <CheckCircleIcon className="w-4 h-4" />
                                        {approving[store.id] ? "Approving..." : "Approve"}
                                    </button>
                                    <button
                                        onClick={() => setRejectingId(rejectingId === store.id ? null : store.id)}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition inline-flex items-center gap-2"
                                    >
                                        <XCircleIcon className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            )}

                            {/* Reject Reason Input */}
                            {rejectingId === store.id && store.verificationStatus === "pending" && (
                                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Enter reason for rejection..."
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                                        rows="3"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRejectSubmit(store.id)}
                                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition"
                                        >
                                            Submit Rejection
                                        </button>
                                        <button
                                            onClick={() => {
                                                setRejectingId(null)
                                                setRejectReason("")
                                            }}
                                            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition hover:bg-slate-300 dark:hover:bg-slate-700"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <div className="text-center">
                        <AlertCircleIcon className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                        <h1 className="text-xl text-slate-600 dark:text-slate-400 font-medium">No stores found</h1>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {showPreview && selectedStore && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowPreview(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full p-6"
                        onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                            {selectedStore.preview === 'selfie' ? 'Facial Verification' : 'Document Image'}
                        </h3>
                        <div className="relative w-full h-[400px] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                            <Image
                                src={selectedStore.preview === 'selfie' ? selectedStore.facialVerificationUrl : selectedStore.verificationDocumentUrl}
                                alt="Preview"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <button
                            onClick={() => setShowPreview(false)}
                            className="mt-4 w-full px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition hover:bg-slate-300 dark:hover:bg-slate-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
