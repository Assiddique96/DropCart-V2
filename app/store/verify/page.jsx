'use client'
import Loading from "@/components/Loading"
import { useAuth } from "@clerk/nextjs"
import { AlertCircleIcon, CheckCircleIcon, ClockIcon, ShieldCheckIcon, UploadIcon, XCircleIcon } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import axios from "axios"
import Image from "next/image"
import { getStoreAuthHeaders } from "@/lib/storeAuthHeaders"

export default function VerifyStore() {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true)
    const [storeInfo, setStoreInfo] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        cacNumber: '',
        verificationDocumentType: 'NIN',
        verificationDocumentNumber: '',
        verificationDocumentImage: null,
        facialVerificationImage: null,
    })
    const [previews, setPreviews] = useState({
        document: null,
        selfie: null,
    })

    const fetchStoreInfo = async () => {
        try {
            const headers = await getStoreAuthHeaders(getToken)
            const { data } = await axios.get('/api/store/info', { headers })
            setStoreInfo(data.store)
            
            // Pre-fill if already verified or pending
            if (data.store.cacNumber) {
                setFormData(prev => ({
                    ...prev,
                    cacNumber: data.store.cacNumber,
                    verificationDocumentType: data.store.verificationDocumentType || 'NIN',
                    verificationDocumentNumber: data.store.verificationDocumentNumber,
                }))
            }
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStoreInfo()
    }, [])

    const handleFileChange = (e, field) => {
        const file = e.target.files[0]
        if (file) {
            setFormData(prev => ({ ...prev, [field]: file }))
            const reader = new FileReader()
            reader.onload = (event) => {
                setPreviews(prev => ({
                    ...prev,
                    [field === 'verificationDocumentImage' ? 'document' : 'selfie']: event.target.result
                }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.cacNumber.trim()) {
            toast.error('CAC number is required')
            return
        }
        if (!formData.verificationDocumentNumber.trim()) {
            toast.error('Document number is required')
            return
        }
        if (!formData.verificationDocumentImage) {
            toast.error('Document image is required')
            return
        }
        if (!formData.facialVerificationImage) {
            toast.error('Facial verification image is required')
            return
        }

        setSubmitting(true)
        try {
            const form = new FormData()
            form.append('cacNumber', formData.cacNumber)
            form.append('verificationDocumentType', formData.verificationDocumentType)
            form.append('verificationDocumentNumber', formData.verificationDocumentNumber)
            form.append('verificationDocumentImage', formData.verificationDocumentImage)
            form.append('facialVerificationImage', formData.facialVerificationImage)

            const headers = await getStoreAuthHeaders(getToken)
            const { data } = await axios.post('/api/store/verify', form, { headers })
            
            toast.success(data.message)
            await fetchStoreInfo()
            setFormData({
                cacNumber: '',
                verificationDocumentType: 'NIN',
                verificationDocumentNumber: '',
                verificationDocumentImage: null,
                facialVerificationImage: null,
            })
            setPreviews({ document: null, selfie: null })
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <Loading />

    const getStatusIcon = (status) => {
        switch (status) {
            case 'verified':
                return <CheckCircleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            case 'pending':
                return <ClockIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            case 'rejected':
                return <XCircleIcon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            default:
                return <AlertCircleIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'verified':
                return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
            case 'pending':
                return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
            case 'rejected':
                return 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50'
            default:
                return 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800/50'
        }
    }

    const getStatusText = (status) => {
        switch (status) {
            case 'verified':
                return 'Your store is verified'
            case 'pending':
                return 'Verification pending - awaiting admin review'
            case 'rejected':
                return 'Verification rejected'
            default:
                return 'Store not yet verified'
        }
    }

    return (
        <div className="text-slate-500 dark:text-slate-300 mb-28 max-w-4xl">
            <h1 className="text-2xl mb-2">Verify Store <span className="text-slate-800 dark:text-slate-100 font-medium">{storeInfo?.name}</span></h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Complete your store verification to establish trust with your customers.</p>

            {/* Status Card */}
            <div className={`border rounded-xl p-6 mb-8 flex items-start gap-4 ${getStatusColor(storeInfo?.verificationStatus || 'unverified')}`}>
                <div className="shrink-0 mt-0.5">
                    {getStatusIcon(storeInfo?.verificationStatus || 'unverified')}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {getStatusText(storeInfo?.verificationStatus || 'unverified')}
                    </p>
                    {storeInfo?.verificationStatus === 'rejected' && storeInfo?.verificationRejectedReason && (
                        <p className="text-sm mt-2 text-slate-700 dark:text-slate-200">
                            <strong>Reason:</strong> {storeInfo.verificationRejectedReason}
                        </p>
                    )}
                    {storeInfo?.verificationStatus === 'pending' && (
                        <p className="text-sm mt-2 text-slate-700 dark:text-slate-200">
                            Your verification request is under review. We'll notify you once the process is complete.
                        </p>
                    )}
                    {storeInfo?.verificationStatus === 'verified' && (
                        <p className="text-sm mt-2 text-slate-700 dark:text-slate-200">
                            Your store has been verified. Customers can shop with confidence.
                        </p>
                    )}
                </div>
            </div>

            {/* Form - Only show if not verified or pending */}
            {storeInfo?.verificationStatus !== 'verified' && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100 mb-2">
                            CAC Registration Number
                        </label>
                        <input
                            type="text"
                            name="cacNumber"
                            value={formData.cacNumber}
                            onChange={handleInputChange}
                            placeholder="e.g., RC12345678"
                            disabled={storeInfo?.verificationStatus === 'pending'}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your Corporate Affairs Commission registration number</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100 mb-2">
                                Document Type
                            </label>
                            <select
                                name="verificationDocumentType"
                                value={formData.verificationDocumentType}
                                onChange={handleInputChange}
                                disabled={storeInfo?.verificationStatus === 'pending'}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="NIN">National ID (NIN)</option>
                                <option value="PASSPORT">Passport</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100 mb-2">
                                Document Number
                            </label>
                            <input
                                type="text"
                                name="verificationDocumentNumber"
                                value={formData.verificationDocumentNumber}
                                onChange={handleInputChange}
                                placeholder={formData.verificationDocumentType === 'NIN' ? 'e.g., 12345678901' : 'e.g., A12345678'}
                                disabled={storeInfo?.verificationStatus === 'pending'}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100 mb-2">
                            Upload {formData.verificationDocumentType === 'NIN' ? 'NIN' : 'Passport'} Copy
                        </label>
                        <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-slate-400 dark:hover:border-slate-600 transition cursor-pointer"
                            onClick={() => document.getElementById('docInput').click()}>
                            {previews.document ? (
                                <div className="space-y-3">
                                    <Image
                                        src={previews.document}
                                        alt="Document preview"
                                        width={200}
                                        height={200}
                                        className="w-32 h-32 object-cover rounded-lg mx-auto border border-slate-200 dark:border-slate-700"
                                    />
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Document uploaded</p>
                                </div>
                            ) : (
                                <>
                                    <UploadIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Click to upload document</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                                </>
                            )}
                            <input
                                id="docInput"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'verificationDocumentImage')}
                                disabled={storeInfo?.verificationStatus === 'pending'}
                                className="hidden"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100 mb-2">
                            Facial Verification (Selfie)
                        </label>
                        <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-slate-400 dark:hover:border-slate-600 transition cursor-pointer"
                            onClick={() => document.getElementById('selfieInput').click()}>
                            {previews.selfie ? (
                                <div className="space-y-3">
                                    <Image
                                        src={previews.selfie}
                                        alt="Selfie preview"
                                        width={200}
                                        height={200}
                                        className="w-32 h-32 object-cover rounded-lg mx-auto border border-slate-200 dark:border-slate-700"
                                    />
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Selfie uploaded</p>
                                </div>
                            ) : (
                                <>
                                    <UploadIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Click to upload selfie</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                                </>
                            )}
                            <input
                                id="selfieInput"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'facialVerificationImage')}
                                disabled={storeInfo?.verificationStatus === 'pending'}
                                className="hidden"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            ℹ️ Make sure your documents are clear and readable. Your information will be kept confidential and used only for verification purposes.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || storeInfo?.verificationStatus === 'pending'}
                        className="w-full px-4 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Submitting...' : storeInfo?.verificationStatus === 'pending' ? 'Verification in Progress' : 'Submit for Verification'}
                    </button>
                </form>
            )}
        </div>
    )
}
