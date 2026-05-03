'use client'
import { assets } from '@/assets/assets'
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import CategoriesMarquee from './CategoriesMarquee'

function isValidImageSrc(src) {
    if (src == null) return false
    if (typeof src === 'string') return src.trim() !== ''
    return true
}

/** Primary image of the product with the highest average rating (tie-break: more reviews). */
function getTopRatedPrimaryImage(products) {
    if (!Array.isArray(products) || products.length === 0) return null
    const scored = []
    for (const p of products) {
        const rs = p.rating
        if (!Array.isArray(rs) || rs.length === 0) continue
        const img = p.images?.[0]
        if (!img) continue
        const sum = rs.reduce((s, r) => s + (Number(r.rating) || 0), 0)
        const avg = sum / rs.length
        scored.push({ avg, n: rs.length, img })
    }
    if (scored.length === 0) return null
    scored.sort((a, b) => b.avg - a.avg || b.n - a.n)
    return scored[0].img
}

/** Primary image of the product with the largest discount vs MRP (tie-break: larger absolute saving). */
function getTopDiscountPrimaryImage(products) {
    if (!Array.isArray(products) || products.length === 0) return null
    const scored = []
    for (const p of products) {
        const mrp = Number(p.mrp) || 0
        const price = Number(p.price) || 0
        const img = p.images?.[0]
        if (!img || mrp <= 0 || price <= 0 || price >= mrp) continue
        const off = mrp - price
        const pct = (off / mrp) * 100
        scored.push({ pct, off, img })
    }
    if (scored.length === 0) return null
    scored.sort((a, b) => b.pct - a.pct || b.off - a.off)
    return scored[0].img
}

function useCarouselIndex(length, intervalMs) {
    const [index, setIndex] = useState(0)
    useEffect(() => {
        if (length <= 1) return undefined
        const t = setInterval(() => {
            setIndex((i) => (i + 1) % length)
        }, intervalMs)
        return () => clearInterval(t)
    }, [length, intervalMs])
    useEffect(() => {
        setIndex(0)
    }, [length])
    return [index, setIndex]
}

const Hero = () => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const products = useSelector((state) => state.product.list)
    const topRatedImage = useMemo(() => getTopRatedPrimaryImage(products), [products])
    const topDiscountImage = useMemo(() => getTopDiscountPrimaryImage(products), [products])

    const defaults = useMemo(() => ({
        featured: [{
            image: assets.hero_model_img,
            badgeLabel: 'NEWS',
            badgeText: `20% Shipping Discount on Orders Above ${currency}1,000,000.00!`,
            title: "Gadgets you'll love. Prices you'll trust.",
            line1: 'Perfect for small and medium-sized businesses.',
            line2: 'Order from the comfort of your home/office anywhere nation wide.',
            priceLabel: 'Starts from',
            price: `${currency}40,000`,
            cta: 'Shop Now!',
            href: '/shop',
        }],
        promo1: [{
            image: topRatedImage || assets.hero_product_img1,
            title: 'Best products',
            subtitle: 'View more',
            href: '/shop',
            variant: 'light',
        }],
        promo2: [{
            image: topDiscountImage || assets.hero_product_img2,
            title: 'Top discounts',
            subtitle: 'View more',
            href: '/shop',
            variant: 'medium',
        }],
    }), [currency, topRatedImage, topDiscountImage])

    const [remote, setRemote] = useState(undefined)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const res = await fetch('/api/home/content')
                const j = await res.json()
                if (!cancelled) setRemote(j)
            } catch {
                if (!cancelled) setRemote({ featured: [], promo1: [], promo2: [] })
            }
        })()
        return () => { cancelled = true }
    }, [])

    const featuredSlides = remote === undefined
        ? defaults.featured
        : (remote.featured?.length
            ? remote.featured.map((s) => ({
                ...s,
                image: isValidImageSrc(s.image) ? s.image : defaults.featured[0].image,
            }))
            : defaults.featured)

    const promo1Slides = remote === undefined
        ? defaults.promo1
        : (remote.promo1?.length
            ? remote.promo1.map((s) => ({
                ...s,
                image: isValidImageSrc(s.image) ? s.image : defaults.promo1[0].image,
            }))
            : defaults.promo1)

    const promo2Slides = remote === undefined
        ? defaults.promo2
        : (remote.promo2?.length
            ? remote.promo2.map((s) => ({
                ...s,
                image: isValidImageSrc(s.image) ? s.image : defaults.promo2[0].image,
            }))
            : defaults.promo2)

    const [fi, setFi] = useCarouselIndex(featuredSlides.length, 6500)
    const [p1i, setP1i] = useCarouselIndex(promo1Slides.length, 5500)
    const [p2i, setP2i] = useCarouselIndex(promo2Slides.length, 5500)

    const go = (setter, len, delta) => {
        setter((i) => (i + delta + len) % len)
    }

    return (
        <div className='mx-6'>
            <div className='flex max-xl:flex-col gap-8 max-w-7xl mx-auto my-10'>
                <div className='relative flex-1 flex flex-col rounded-3xl xl:min-h-100 group overflow-hidden bg-gray-300'>
                    <div
                        className='flex transition-transform duration-500 ease-out h-full'
                        style={{ transform: `translateX(-${fi * 100}%)` }}
                    >
                        {featuredSlides.map((slide, idx) => (
                            <div
                                key={idx}
                                className='min-w-full shrink-0 relative min-h-[300px] sm:min-h-[360px] xl:min-h-[420px] w-full'
                            >
                                <Image
                                    src={slide.image}
                                    alt=""
                                    fill
                                    className='object-cover object-center'
                                    sizes='(max-width: 1280px) 100vw, min(896px, 100vw)'
                                    priority={idx === 0}
                                />
                                <div
                                    className='absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/25'
                                    aria-hidden
                                />
                                <div className='absolute inset-0 z-10 p-5 sm:p-16 flex flex-col justify-center max-w-2xl'>
                                    {(slide.badgeText || slide.badgeLabel) && (
                                        <div className='inline-flex w-fit items-center gap-3 bg-black/40 backdrop-blur-sm text-gray-200 pr-4 py-1 pl-1 rounded-full text-xs sm:text-sm border border-white/10'>
                                            {slide.badgeLabel && (
                                                <span className='bg-white/25 px-3 py-1 max-sm:ml-0 rounded-full text-white text-xs'>{slide.badgeLabel}</span>
                                            )}
                                            {slide.badgeText}
                                            <ChevronRightIcon className='group-hover:ml-2 transition-all shrink-0 text-white/80' size={16} />
                                        </div>
                                    )}
                                    {slide.title && (
                                        <h2 className='text-3xl sm:text-5xl leading-[1.2] my-3 font-medium text-white drop-shadow-md max-w-md'>
                                            {slide.title}
                                        </h2>
                                    )}
                                    {(slide.line1 || slide.line2) && (
                                        <div className='text-white/90 text-sm font-medium mt-4 sm:mt-8 drop-shadow'>
                                            {slide.line1 && <p>{slide.line1}</p>}
                                            {slide.line2 && <p>{slide.line2}</p>}
                                        </div>
                                    )}
                                    {(slide.price || slide.priceLabel) && (
                                        <div className='text-white/95 text-sm font-medium mt-4 sm:mt-8 drop-shadow'>
                                            {slide.priceLabel && <p>{slide.priceLabel}</p>}
                                            {slide.price && <p className='text-3xl font-semibold text-white'>{slide.price}</p>}
                                        </div>
                                    )}
                                    {slide.cta && slide.href && (
                                        <Link
                                            href={slide.href}
                                            className='inline-block w-fit bg-white text-slate-900 text-sm py-2.5 px-7 sm:py-4 sm:px-10 mt-4 sm:mt-10 rounded-md hover:bg-white/95 hover:scale-[1.02] active:scale-95 transition text-center font-medium shadow-lg'
                                        >
                                            {slide.cta}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {featuredSlides.length > 1 && (
                        <>
                            <button
                                type='button'
                                aria-label='Previous slide'
                                onClick={() => go(setFi, featuredSlides.length, -1)}
                                className='absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/90 text-slate-800 shadow hover:bg-white'
                            >
                                <ChevronLeftIcon size={20} />
                            </button>
                            <button
                                type='button'
                                aria-label='Next slide'
                                onClick={() => go(setFi, featuredSlides.length, 1)}
                                className='absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/90 text-slate-800 shadow hover:bg-white'
                            >
                                <ChevronRightIcon size={20} />
                            </button>
                            <div className='absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20'>
                                {featuredSlides.map((_, i) => (
                                    <button
                                        key={i}
                                        type='button'
                                        aria-label={`Go to slide ${i + 1}`}
                                        onClick={() => setFi(i)}
                                        className={`h-2 rounded-full transition-all ${i === fi ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <div className='flex flex-col md:flex-row xl:flex-col gap-5 w-full xl:max-w-sm text-sm'>
                    <PromoCarousel
                        slides={promo1Slides}
                        index={p1i}
                        setIndex={setP1i}
                    />
                    <PromoCarousel
                        slides={promo2Slides}
                        index={p2i}
                        setIndex={setP2i}
                    />
                </div>
            </div>
            <CategoriesMarquee />
        </div>

    )
}

/** Darkening overlay on promo background — variant presets from admin. */
const PROMO_BG_OVERLAY = {
    light: 'bg-gradient-to-t from-black/70 via-black/40 to-black/25',
    medium: 'bg-gradient-to-t from-black/75 via-black/50 to-black/30',
    dark: 'bg-gradient-to-t from-black/85 via-black/65 to-black/40',
}

function PromoCarousel({ slides, index, setIndex }) {
    return (
        <div className='relative flex-1 w-full min-h-[200px] rounded-3xl overflow-hidden shadow-md'>
            <div
                className='flex transition-transform duration-500 ease-out h-full min-h-[200px]'
                style={{ transform: `translateX(-${index * 100}%)` }}
            >
                {slides.map((slide, idx) => (
                    <Link
                        key={idx}
                        href={slide.href || '/shop'}
                        className='min-w-full shrink-0 relative block min-h-[200px] group'
                    >
                        {isValidImageSrc(slide.image) ? (
                            <Image
                                src={slide.image}
                                alt=""
                                fill
                                className='object-cover object-center'
                                sizes='(max-width: 1280px) 100vw, 380px'
                            />
                        ) : (
                            <div className='absolute inset-0 bg-slate-400' aria-hidden />
                        )}
                        <div
                            className={`absolute inset-0 ${PROMO_BG_OVERLAY[slide.variant] || PROMO_BG_OVERLAY.light}`}
                            aria-hidden
                        />
                        <div className='absolute inset-0 z-10 p-6 px-8 flex flex-col justify-end'>
                            <p className='text-2xl sm:text-3xl font-semibold text-white drop-shadow-md max-w-[14rem] leading-tight'>
                                {slide.title || 'Offers'}
                            </p>
                            <p className='flex items-center gap-1 mt-3 text-white/95 text-sm font-medium drop-shadow'>
                                {slide.subtitle || 'View more'}
                                <ArrowRightIcon className='group-hover:translate-x-0.5 transition-transform shrink-0' size={18} />
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
            {slides.length > 1 && (
                <div className='absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-20'>
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            type='button'
                            aria-label={`Promo slide ${i + 1}`}
                            onClick={(e) => { e.preventDefault(); setIndex(i) }}
                            className={`h-1.5 rounded-full ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/45'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Hero
