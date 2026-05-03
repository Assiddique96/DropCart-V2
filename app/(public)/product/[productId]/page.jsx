'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import RelatedProducts from "@/components/RelatedProducts";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addRecentlyViewed } from "@/lib/features/recentlyViewed/recentlyViewedSlice";
import { FacebookIcon, TwitterIcon, LinkIcon, CheckIcon } from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function Product() {
    const { productId } = useParams();
    const [product, setProduct] = useState();
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const products = useSelector(state => state.product.list);
    const dispatch = useDispatch();

    useEffect(() => {
        const loadProduct = async () => {
            // First check if product is already in Redux store
            const found = products.find(p => p.id === productId);
            if (found) {
                setProduct(found);
                setLoading(false);
                dispatch(addRecentlyViewed(productId));
                return;
            }

            // If not in store, fetch from API
            try {
                const { data } = await axios.get('/api/products');
                const apiProduct = data.products?.find(p => p.id === productId);
                if (apiProduct) {
                    setProduct(apiProduct);
                    dispatch(addRecentlyViewed(productId));
                }
            } catch (error) {
                console.error('Failed to fetch product:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
        scrollTo(0, 0);
    }, [productId, products, dispatch]);

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = product ? `Check out ${product.name} on Shpinx` : 'Check this out on Shpinx';

    const shareOnFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
    };

    const shareOnTwitter = () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
    };

    const shareOnWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const el = document.createElement('input');
            el.value = shareUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4"></div>
                            <p className="text-slate-600">Loading product...</p>
                        </div>
                    </div>
                ) : product ? (
                    <>
                        {/* Breadcrumb */}
                        <div className="text-gray-400 text-xs mt-8 mb-5 flex items-center gap-1.5">
                            <span>Home</span>
                            <span>/</span>
                            <span>Products</span>
                            <span>/</span>
                            <span className="text-slate-600">{product.category}</span>
                        </div>

                        {/* Product Details */}
                        <ProductDetails product={product} />

                        {/* Social sharing */}
                        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100">
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Share</span>
                            <button
                                onClick={shareOnWhatsApp}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-600 transition"
                            >
                                <span className="text-sm">💬</span> WhatsApp
                            </button>
                            <button
                                onClick={shareOnFacebook}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition"
                            >
                                <FacebookIcon size={13} /> Facebook
                            </button>
                            <button
                                onClick={shareOnTwitter}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-sky-400 hover:text-sky-600 transition"
                            >
                                <TwitterIcon size={13} /> X / Twitter
                            </button>
                            <button
                                onClick={copyLink}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-slate-400 transition"
                            >
                                {copied ? <CheckIcon size={13} className="text-green-500" /> : <LinkIcon size={13} />}
                                {copied ? 'Copied!' : 'Copy link'}
                            </button>
                        </div>

                        {/* Description & Reviews */}
                        <ProductDescription product={product} />

                        {/* Related products */}
                        <RelatedProducts product={product} />

                        {/* Recently viewed */}
                        <RecentlyViewed currentProductId={productId} />
                    </>
                ) : (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-slate-800 mb-4">404</h1>
                            <p className="text-slate-600 mb-8">Product not found</p>
                            <Link href="/" className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition">
                                Go Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
