'use client'
/**
 * CloudinaryUpload
 * Unsigned upload widget. Requires NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and
 * NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET env vars to be set.
 *
 * Usage:
 *   <CloudinaryUpload onUpload={(url) => setImageUrl(url)} />
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { UploadCloudIcon, XIcon, CheckIcon } from "lucide-react"

export default function CloudinaryUpload({
  onUpload,
  value,
  label = "Upload image",
  folder = "shpinx",
  className = "",
}) {
  const widgetRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [uploading, setUploading] = useState(false)

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  const openWidget = useCallback(() => {
    if (!cloudName || !uploadPreset) {
      // Fallback: plain file upload via Cloudinary REST API
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!cloudName || !uploadPreset) {
          alert("Cloudinary not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.")
          return
        }
        setUploading(true)
        try {
          const fd = new FormData()
          fd.append("file", file)
          fd.append("upload_preset", uploadPreset)
          fd.append("folder", folder)
          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: fd,
          })
          const data = await res.json()
          if (data.secure_url) {
            onUpload?.(data.secure_url)
          } else {
            alert(data.error?.message || "Upload failed.")
          }
        } catch (err) {
          alert("Upload failed: " + err.message)
        }
        setUploading(false)
      }
      input.click()
      return
    }

    // Use Cloudinary Upload Widget if script is available
    if (widgetRef.current) {
      widgetRef.current.open()
      return
    }

    if (typeof window !== "undefined" && window.cloudinary) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName,
          uploadPreset,
          folder,
          maxFiles: 1,
          sources: ["local", "url"],
          cropping: false,
          resourceType: "image",
          clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "gif"],
          maxFileSize: 5_000_000,
        },
        (error, result) => {
          if (result.event === "success") {
            onUpload?.(result.info.secure_url)
            setUploading(false)
          }
          if (result.event === "close") setUploading(false)
        }
      )
      widgetRef.current.open()
    }
  }, [cloudName, uploadPreset, folder, onUpload])

  // Load Cloudinary script
  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.cloudinary) { setReady(true); return }
    const script = document.createElement("script")
    script.src = "https://widget.cloudinary.com/v2.0/global/all.js"
    script.onload = () => setReady(true)
    document.body.appendChild(script)
  }, [])

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={openWidget}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition disabled:opacity-50 font-medium"
      >
        {uploading ? (
          <><UploadCloudIcon size={13} className="animate-pulse" /> Uploading…</>
        ) : (
          <><UploadCloudIcon size={13} /> {label}</>
        )}
      </button>
      {value && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
          <CheckIcon size={12} /> Uploaded
          <button
            type="button"
            onClick={() => onUpload?.('')}
            className="ml-1 text-slate-400 hover:text-red-500 transition"
            title="Remove image"
          >
            <XIcon size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
