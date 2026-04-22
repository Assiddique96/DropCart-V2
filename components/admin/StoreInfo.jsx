'use client'
import Image from "next/image"
import { MapPin, Mail, Phone } from "lucide-react"

const StoreInfo = ({store}) => {
    return (
        <div className="flex-1 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <Image width={100} height={100} src={store.logo} alt={store.name} className="max-w-20 max-h-20 object-contain shadow rounded-full max-sm:mx-auto" />
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100"> {store.name} </h3>
                <span className="text-sm">@{store.username}</span>

                {/* Status Badge */}
                <span
                    className={`text-xs font-semibold px-4 py-1 rounded-full ${store.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : store.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                        }`}
                >
                    {store.status}
                </span>
            </div>

            <p className="text-slate-600 dark:text-slate-300 my-5 max-w-2xl">{store.description}</p>
            <p className="flex items-center gap-2"> <MapPin size={16} /> {store.address}</p>
            <p className="flex items-center gap-2"><Phone size={16} /> {store.contact}</p>
            <p className="flex items-center gap-2"><Mail size={16} />  {store.email}</p>
            <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-xs space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Verification Details</p>
                <p><span className="font-medium">CAC Number:</span> {store.cacNumber || "N/A"}</p>
                <p><span className="font-medium">Document Type:</span> {store.verificationDocumentType || "N/A"}</p>
                <p><span className="font-medium">Document Number:</span> {store.verificationDocumentNumber || "N/A"}</p>
                <p><span className="font-medium">Document URL:</span> {store.verificationDocumentUrl ? <a href={store.verificationDocumentUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">Open file</a> : "N/A"}</p>
                <p><span className="font-medium">Selfie URL:</span> {store.facialVerificationUrl ? <a href={store.facialVerificationUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">Open file</a> : "N/A"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-xs space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Payout Details</p>
                <p><span className="font-medium">Bank:</span> {store.payoutBankName || "N/A"}</p>
                <p><span className="font-medium">Account Name:</span> {store.payoutAccountName || "N/A"}</p>
                <p><span className="font-medium">Account Number:</span> {store.payoutAccountNumber || "N/A"}</p>
            </div>
            <p className="text-slate-700 dark:text-slate-200 mt-5">Applied  on <span className="text-xs">{new Date(store.createdAt).toLocaleDateString()}</span> by</p>
            <div className="flex items-center gap-2 text-sm ">
                <Image width={36} height={36} src={store.user.image} alt={store.user.name} className="w-9 h-9 rounded-full" />
                <div>
                    <p className="text-slate-600 dark:text-slate-300 dark:text-slate-200 font-medium">{store.user.name}</p>
                    <p className="text-slate-400 dark:text-slate-400">{store.user.email}</p>
                </div>
            </div>
        </div>
    )
} 

export default StoreInfo