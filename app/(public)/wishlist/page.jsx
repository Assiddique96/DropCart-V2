'use client'
import { useSelector, useDispatch } from "react-redux"
import { toggleWishlist } from "@/lib/features/wishlist/wishlistSlice"
import { addToCart } from "@/lib/features/cart/cartSlice"
import ProductCard from "@/components/ProductCard"
import Link from "next/link"
import { HeartIcon } from "lucide-react"
import toast from "react-hot-toast"

export default function WishlistPage() {
    const dispatch = useDispatch()
    const wishlistIds = useSelector(state => state.wishlist.items)
    const allProducts = useSelector(state => state.product.list)

    const wishlistProducts = allProducts.filter(p => wishlistIds.includes(p.id))

    const addAllToCart = () => {
        wishlistProducts.forEach(p => dispatch(addToCart({ productId: p.id })))
        toast.success(`${wishlistProducts.length} item${wishlistProducts.length > 1 ? 's' : ''} added to cart`)
    }

    return (
        <div className="min-h-[70vh] mx-6 mb-24">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between my-8">
                    <div>
                        <h1 className="text-2xl font-medium text-slate-700">My Wishlist</h1>
                        <p className="text-xs text-slate-400 mt-0.5">{wishlistProducts.length} saved item{wishlistProducts.length !== 1 ? 's' : ''}</p>
                    </div>
                    {wishlistProducts.length > 0 && (
                        <button onClick={addAllToCart}
                            className="px-5 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-900 transition">
                            Add All to Cart
                        </button>
                    )}
                </div>

                {wishlistProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <HeartIcon size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium mb-2">Your wishlist is empty</p>
                        <p className="text-sm mb-6">Save items you love by clicking the heart icon on any product.</p>
                        <Link href="/shop"
                            className="px-6 py-2.5 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900 transition">
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-10">
                        {wishlistProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
