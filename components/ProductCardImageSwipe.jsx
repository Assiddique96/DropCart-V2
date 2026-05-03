'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

const SWIPE_PX = 45

/**
 * Swipe / drag horizontally to cycle product images. Tap opens product page (unless a swipe just occurred).
 */
export default function ProductCardImageSwipe({ productId, images, name, children }) {
    const router = useRouter()
    const list = Array.isArray(images) && images.length > 0 ? images : []
    const [idx, setIdx] = useState(0)
    const startX = useRef(0)
    const swiped = useRef(false)

    const safeIdx = list.length ? Math.min(idx, list.length - 1) : 0
    const src = list[safeIdx]

    const go = (dir) => {
        if (list.length <= 1) return
        setIdx((i) => (i + dir + list.length) % list.length)
    }

    const onPointerDown = (e) => {
        startX.current = e.clientX
    }

    const onPointerUp = (e) => {
        if (list.length <= 1) return
        const dx = e.clientX - startX.current
        if (Math.abs(dx) > SWIPE_PX) {
            swiped.current = true
            go(dx < 0 ? 1 : -1)
        }
    }

    const onImageClick = () => {
        if (swiped.current) {
            swiped.current = false
            return
        }
        router.push(`/product/${productId}`)
    }

    return (
        <div className="relative bg-[#F5F5F5] dark:bg-slate-900 h-40 w-full sm:w-60 sm:h-68 rounded-lg overflow-hidden touch-pan-y">
            <button
                type="button"
                className="relative h-full w-full cursor-pointer select-none p-0 border-0 bg-transparent block"
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onClick={onImageClick}
                aria-label={`View ${name}`}
            >
                {src ? (
                    <Image
                        src={src}
                        alt={name}
                        fill
                        sizes="(max-width: 640px) 45vw, 240px"
                        className="object-contain transition duration-300 group-hover:scale-105"
                    />
                ) : null}
            </button>
            {list.length > 1 && (
                <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1 pointer-events-none z-[5]">
                    {list.map((_, i) => (
                        <span
                            key={i}
                            className={`h-1 rounded-full transition-all ${i === safeIdx ? 'w-4 bg-slate-800/90 dark:bg-white/90' : 'w-1 bg-slate-400/80'}`}
                        />
                    ))}
                </div>
            )}
            {children}
        </div>
    )
}
