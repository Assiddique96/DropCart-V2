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

export default function Product() {
    const { productId } = useParams();
    const [product, setProduct] = useState();
    const [copied, setCopied] = useState(false);
    const products = useSelector(state => state.product.list);
    const dispatch = useDispatch();

    useEffect(() => {
        if (products.length > 0) {
            const found = products.find(p => p.id === productId);
            if (found) {
                setProduct(found);
                // Track this view
                dispatch(addRecentlyViewed(productId));
            }
        }
        scrollTo(0, 0);
    }, [productId, products]);

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = product ? `Check out ${product.name} on DropCart` : 'Check this out on DropCart';

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

                {/* Breadcrumb */}
                <div className="text-gray-400 text-xs mt-8 mb-5 flex items-center gap-1.5">
                    <span>Home</span>
                    <span>/</span>
                    <span>Products</span>
                    <span>/</span>
                    <span className="text-slate-600">{product?.category}</span>
                </div>

                {/* Product Details */}
                {product && <ProductDetails product={product} />}

                {/* Social sharing */}
                {product && (
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
                )}

                {/* Description & Reviews */}
                {product && <ProductDescription product={product} />}

                {/* Related products */}
                {product && <RelatedProducts product={product} />}

                {/* Recently viewed */}
                {product && <RecentlyViewed currentProductId={productId} />}

            </div>
        </div>
    );
}
