'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { CheckIcon, XIcon, EyeIcon } from "lucide-react"
import Image from "next/image"

export default function AdminAdRequestsPage() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [adRequests, setAdRequests] = useState([])
  const [processing, setProcessing] = useState(null)

  useEffect(() => {
    fetchAdRequests()
  }, [])

  const fetchAdRequests = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get("/api/admin/ad-requests", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAdRequests(data.adRequests)
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message)
    }
    setLoading(false)
  }

  const processRequest = async (id, status, adminNote = "") => {
    setProcessing(id)
    try {
      const token = await getToken()
      await axios.put(
        "/api/admin/ad-requests",
        { id, status, adminNote },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`Ad request ${status.toLowerCase()}.`)
      fetchAdRequests()
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message)
    }
    setProcessing(null)
  }

  if (loading) return <Loading />

  return (
    <div className="text-slate-500 dark:text-slate-300 mb-28">
      <h1 className="text-2xl mb-5">
        Ad <span className="text-slate-800 dark:text-slate-100 font-medium">Requests</span>
      </h1>

      {adRequests.length === 0 ? (
        <p className="text-slate-400">No ad requests yet.</p>
      ) : (
        <div className="grid gap-4">
          {adRequests.map((request) => (
            <div key={request.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <Image
                    src={request.product.images[0] || "/placeholder.png"}
                    alt={request.product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {request.product.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        by {request.store.name} ({request.store.username})
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        ₦{request.product.price.toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400">
                        {request.durationDays} day{request.durationDays === 1 ? '' : 's'} · ₦{request.totalPrice.toLocaleString()} total
                        <span className="text-slate-400 font-normal"> (₦{request.pricePerDay.toLocaleString()}/day)</span>
                      </p>
                      {request.status === 'APPROVED' && request.endsAt && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          Live until {new Date(request.endsAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      request.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {request.product.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Requested on {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                  {request.adminNote && (
                    <p className="mt-1 text-xs text-slate-500 italic">
                      Note: {request.adminNote}
                    </p>
                  )}
                </div>
              </div>

              {request.status === 'PENDING' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => processRequest(request.id, 'APPROVED')}
                    disabled={processing === request.id}
                    className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition disabled:opacity-50"
                  >
                    <CheckIcon size={16} /> Approve
                  </button>
                  <button
                    onClick={() => {
                      const note = prompt("Admin note (optional):")
                      processRequest(request.id, 'REJECTED', note)
                    }}
                    disabled={processing === request.id}
                    className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
                  >
                    <XIcon size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}