'use client'
import { StarIcon, HeartIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleWishlist } from '@/lib/features/wishlist/wishlistSlice'
import { addToCart } from '@/lib/features/cart/cartSlice'
import toast from 'react-hot-toast'

const ProductCard = ({ product }) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'
    const dispatch = useDispatch()
    const wishlistItems = useSelector(state => state.wishlist.items)
    const isWishlisted = wishlistItems.includes(product.id)
    const isAbroad = product.origin === 'ABROAD'

    const avgRating = product.rating?.length
        ? Math.round(product.rating.reduce((acc, r) => acc + r.rating, 0) / product.rating.length)
        : 0

    const handleWishlist = (e) => {
        e.preventDefault()
        e.stopPropagation()
        dispatch(toggleWishlist(product.id))
        toast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️', { icon: isWishlisted ? '🤍' : '❤️' })
    }

    const handleAddToCart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        dispatch(addToCart({ productId: product.id }))
        toast.success('Added to cart')
    }

    return (
        <Link href={`/product/${product.id}`} className="group max-xl:mx-auto relative">
            <div className="relative bg-[#F5F5F5] dark:bg-slate-900 h-40 sm:w-60 sm:h-68 rounded-lg flex items-center justify-center overflow-hidden">
                <Image
                    width={500} height={500}
                    className="max-h-30 sm:max-h-40 w-auto group-hover:scale-110 transition duration-300"
                    src={product.images[0]} alt={product.name}
                />

                {/* ✈️ Shipped from Abroad badge */}
                {isAbroad && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                        ✈️ <span>Abroad</span>
                    </div>
                )}

                {/* Wishlist button */}
                <button
                    onClick={handleWishlist}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/95 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 backdrop-blur-sm shadow-sm hover:scale-110 transition"
                    title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <HeartIcon
                        size={16}
                        className={isWishlisted ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}
                        fill={isWishlisted ? '#ef4444' : 'none'}
                    />
                </button>

                {/* Quick add to cart on hover */}
                <button
                    onClick={handleAddToCart}
                    className="absolute bottom-0 left-0 right-0 bg-slate-800/90 text-white text-xs py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200"
                >
                    + Add to Cart
                </button>
            </div>

            <div className="flex justify-between gap-3 text-sm text-slate-800 pt-2 max-w-60">
                <div>
                    <p className="font-medium truncate max-w-[140px]">{product.name}</p>
                    <div className="flex mt-0.5">
                        {Array(5).fill('').map((_, i) => (
                            <StarIcon key={i} size={13} className="text-transparent" fill={avgRating >= i + 1 ? "#00C950" : "#D1D5DB"} />
                        ))}
                        {product.rating?.length > 0 && (
                            <span className="text-xs text-slate-400 ml-1">({product.rating.length})</span>
                        )}
                    </div>
                    {isAbroad && (
                        <p className="text-[10px] text-blue-500 mt-0.5">Ships in 20–25 days</p>
                    )}
                </div>
                <div className="text-right shrink-0">
                    <p className="font-semibold">{currency}{product.price.toLocaleString()}</p>
                    {product.mrp > product.price && (
                        <p className="text-xs text-slate-400 line-through">{currency}{product.mrp.toLocaleString()}</p>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default ProductCard
