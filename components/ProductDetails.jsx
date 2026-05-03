'use client'
import { addToCart } from "@/lib/features/cart/cartSlice";
import toast from "react-hot-toast";
import { StarIcon, TagIcon, CreditCardIcon, UserIcon, TruckIcon, ClockIcon, BanIcon, CheckIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, ZoomInIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

const normalizeVariants = (variants = {}) => {
    return Object.keys(variants).sort().reduce((acc, key) => {
        acc[key] = variants[key];
        return acc;
    }, {});
};

const areVariantsEqual = (a = {}, b = {}) => {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key, index) => key === bKeys[index] && String(a[key]) === String(b[key]));
};

const ProductDetails = ({ product }) => {
    const productId = product.id;
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦';
    const isAbroad = product.origin === 'ABROAD';
    const acceptsCod = !isAbroad && product.acceptCod !== false;

    const { items: cartItems, cartItems: cartSummary } = useSelector(state => state.cart);
    const dispatch = useDispatch();
    const router = useRouter();

    const images = (product.images || []).filter(Boolean)
    const [mainIdx, setMainIdx] = useState(0)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [zoomHover, setZoomHover] = useState(false)
    const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 })
    const swipeStart = useRef(0)
    const swipeBlockedClick = useRef(false)

    const mainImage = images[Math.min(mainIdx, Math.max(0, images.length - 1))] || images[0]
    const [selectedOptions, setSelectedOptions] = useState({}) // { [groupLabel]: optionLabel }

    useEffect(() => {
        setMainIdx(0)
    }, [product.id])

    useEffect(() => {
        if (!lightboxOpen) return
        const onKey = (e) => {
            if (e.key === 'Escape') setLightboxOpen(false)
            if (!images.length) return
            if (e.key === 'ArrowLeft') setMainIdx((i) => (i - 1 + images.length) % images.length)
            if (e.key === 'ArrowRight') setMainIdx((i) => (i + 1) % images.length)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [lightboxOpen, images.length])

    const goThumb = (idx) => setMainIdx(idx)

    const onMainPointerDown = (e) => {
        swipeStart.current = e.clientX
    }
    const onMainPointerUp = (e) => {
        if (images.length <= 1) return
        const dx = e.clientX - swipeStart.current
        if (Math.abs(dx) > 45) {
            swipeBlockedClick.current = true
            setMainIdx((i) => {
                const len = images.length
                return dx < 0 ? (i + 1) % len : (i - 1 + len) % len
            })
        }
    }
    const openZoom = () => {
        if (swipeBlockedClick.current) {
            swipeBlockedClick.current = false
            return
        }
        setLightboxOpen(true)
    }

    useEffect(() => {
        if (lightboxOpen) {
            const prev = document.body.style.overflow
            document.body.style.overflow = 'hidden'
            return () => { document.body.style.overflow = prev }
        }
    }, [lightboxOpen])
    const variantGroups = product.variantGroups || []

    // Compute effective price based on selected options' price modifiers
    const priceModifierTotal = variantGroups.reduce((sum, group) => {
        const selected = group.options?.find(o => o.label === selectedOptions[group.label])
        return sum + (selected?.priceModifier ?? 0)
    }, 0)
    const effectivePrice = product.price + priceModifierTotal

    // All required groups must have a selection before adding to cart
    const requiredGroups = variantGroups.filter(g => g.required)
    const allRequiredSelected = requiredGroups.every(g => selectedOptions[g.label])
    const canAddToCart = variantGroups.length === 0 || allRequiredSelected

    const exactCartItem = cartItems.find(item => item.productId === productId && areVariantsEqual(item.variants, selectedOptions))
    const exactVariantQuantity = exactCartItem?.quantity ?? 0
    const productQuantity = cartSummary[productId] || 0
    const isVariantProduct = variantGroups.length > 0

    const handleAddToCart = () => {
        if (!canAddToCart) {
            const missing = requiredGroups.filter(g => !selectedOptions[g.label]).map(g => g.label)
            toast.error(`Please select: ${missing.join(", ")}`)
            return
        }
        addToCartHandler()
    }
    const [shippingFees, setShippingFees] = useState({ local: 7000, abroad: 15000 });

    useEffect(() => {
        axios.get('/api/config').then(({ data }) => {
            setShippingFees({
                local:  data.shipping_base_fee   ?? 7000,
                abroad: data.shipping_abroad_fee ?? 15000,
            });
        }).catch(() => {});
    }, []);

    const addToCartHandler = () => dispatch(addToCart({ productId, variants: normalizeVariants(selectedOptions) }));

    const avgRating = product.rating?.length
        ? product.rating.reduce((acc, item) => acc + item.rating, 0) / product.rating.length
        : 0;

    const shippingFee = isAbroad ? shippingFees.abroad : shippingFees.local;
    const eta = isAbroad ? '20 – 25 days' : '7 – 10 days';

    return (
        <div className="flex max-lg:flex-col gap-12">
            {/* Image gallery */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl lg:max-w-none lg:w-auto">
                <div className="flex flex-row sm:flex-col gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 shrink-0 order-2 sm:order-1">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => goThumb(index)}
                            className={`relative shrink-0 size-16 rounded-xl overflow-hidden bg-slate-100 border-2 transition ${
                                index === Math.min(mainIdx, Math.max(0, images.length - 1))
                                    ? 'border-slate-800 ring-2 ring-slate-800/20'
                                    : 'border-transparent hover:border-slate-300'
                            }`}
                        >
                            <Image src={image} alt="" fill className="object-cover" sizes="64px" />
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 min-w-0 order-1 sm:order-2">
                    <div
                        className="relative w-full aspect-square max-w-lg mx-auto rounded-xl bg-slate-100 overflow-hidden border border-slate-100 shadow-sm touch-pan-y sm:cursor-zoom-in"
                        onPointerDown={onMainPointerDown}
                        onPointerUp={onMainPointerUp}
                        onMouseEnter={() => setZoomHover(true)}
                        onMouseLeave={() => setZoomHover(false)}
                        onMouseMove={(e) => {
                            const r = e.currentTarget.getBoundingClientRect()
                            setZoomOrigin({
                                x: ((e.clientX - r.left) / r.width) * 100,
                                y: ((e.clientY - r.top) / r.height) * 100,
                            })
                        }}
                        onClick={openZoom}
                    >
                        {mainImage ? (
                            <>
                                <Image
                                    src={mainImage}
                                    alt={product.name}
                                    fill
                                    priority
                                    className={`z-0 object-contain transition-transform duration-150 ease-out ${zoomHover ? 'sm:scale-[1.65]' : 'scale-100'}`}
                                    style={{ transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }}
                                    sizes="(max-width: 1024px) 100vw, 480px"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openZoom() }}
                                    className="sm:hidden absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md border border-slate-200"
                                >
                                    <ZoomInIcon size={14} /> Zoom
                                </button>
                            </>
                        ) : null}
                        {isAbroad && (
                            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow pointer-events-none">
                                ✈️ Shipped from Abroad
                            </div>
                        )}
                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setMainIdx((i) => (i - 1 + images.length) % images.length) }}
                                    className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/95 p-2 shadow border border-slate-200 text-slate-700 hover:bg-white"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeftIcon size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setMainIdx((i) => (i + 1) % images.length) }}
                                    className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/95 p-2 shadow border border-slate-200 text-slate-700 hover:bg-white"
                                    aria-label="Next image"
                                >
                                    <ChevronRightIcon size={18} />
                                </button>
                            </>
                        )}
                    </div>
                    {images.length > 1 && (
                        <p className="text-center text-[11px] text-slate-400 mt-2 sm:hidden">Swipe on the image to see more</p>
                    )}
                </div>
            </div>

            {lightboxOpen && mainImage ? (
                <div
                    className="fixed inset-0 z-[300] flex items-center justify-center bg-black/92 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Product image full size"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        type="button"
                        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                        onClick={(e) => { e.stopPropagation(); setLightboxOpen(false) }}
                        aria-label="Close"
                    >
                        <XIcon size={22} />
                    </button>
                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"
                                onClick={(e) => { e.stopPropagation(); setMainIdx((i) => (i - 1 + images.length) % images.length) }}
                                aria-label="Previous"
                            >
                                <ChevronLeftIcon size={28} />
                            </button>
                            <button
                                type="button"
                                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"
                                onClick={(e) => { e.stopPropagation(); setMainIdx((i) => (i + 1) % images.length) }}
                                aria-label="Next"
                            >
                                <ChevronRightIcon size={28} />
                            </button>
                        </>
                    )}
                    <div
                        className="relative w-full h-full max-h-[90vh] max-w-[min(100vw,1200px)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={mainImage}
                            alt={product.name}
                            fill
                            className="object-contain"
                            sizes="100vw"
                        />
                    </div>
                </div>
            ) : null}

            {/* Product info */}
            <div className="flex-1">
                <h1 className="text-3xl font-semibold text-slate-800">{product.name}</h1>

                {/* Ratings */}
                <div className="flex items-center mt-2 gap-2">
                    {Array(5).fill('').map((_, i) => (
                        <StarIcon key={i} size={14} className="text-transparent mt-0.5"
                            fill={avgRating >= i + 1 ? "#00C950" : "#D1D5DB"} />
                    ))}
                    <p className="text-sm text-slate-500">{product.rating?.length || 0} Reviews</p>
                </div>

                {/* Price */}
                <div className="flex items-center my-5 gap-3">
                    <p className="text-2xl font-bold text-slate-800">{currency}{effectivePrice.toLocaleString()}</p>
                    {product.mrp > product.price && (
                        <p className="text-lg text-slate-400 line-through">{currency}{product.mrp.toLocaleString()}</p>
                    )}
                    {product.mrp > product.price && (
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Save {((product.mrp - product.price) / product.mrp * 100).toFixed(0)}%
                        </span>
                    )}
                    {priceModifierTotal !== 0 && (
                        <span className="text-xs text-slate-400">
                            (base {currency}{product.price.toLocaleString()} {priceModifierTotal > 0 ? "+" : ""}{priceModifierTotal.toLocaleString()})
                        </span>
                    )}
                </div>

                {/* Variant selectors */}
                {variantGroups.length > 0 && (
                    <div className="space-y-4 mb-6">
                        {variantGroups.map(group => (
                            <div key={group.id}>
                                <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                                    {group.label}
                                    {group.required && <span className="text-red-400">*</span>}
                                    {selectedOptions[group.label] && (
                                        <span className="font-normal text-slate-400 ml-1">— {selectedOptions[group.label]}</span>
                                    )}
                                </p>

                                {group.type === "IMAGE" ? (
                                    /* Image swatch selector */
                                    <div className="flex flex-wrap gap-2">
                                        {group.options?.map(opt => {
                                            const isSelected = selectedOptions[group.label] === opt.label
                                            return (
                                                <button key={opt.id} type="button"
                                                    onClick={() => setSelectedOptions(p => ({ ...p, [group.label]: opt.label }))}
                                                    disabled={!opt.inStock}
                                                    title={opt.label + (opt.priceModifier ? ` (${opt.priceModifier > 0 ? "+" : ""}${opt.priceModifier.toLocaleString()})` : "")}
                                                    className={`relative group/swatch rounded-lg border-2 overflow-hidden transition ${
                                                        isSelected ? "border-slate-800 shadow-md" : "border-slate-200 hover:border-slate-400"
                                                    } ${!opt.inStock ? "opacity-40 cursor-not-allowed" : ""}`}>
                                                    {opt.image ? (
                                                        <img src={opt.image} alt={opt.label} className="w-14 h-14 object-cover" />
                                                    ) : (
                                                        <div className="w-14 h-14 bg-slate-100 flex items-center justify-center text-xs text-slate-500 p-1 text-center leading-tight">
                                                            {opt.label}
                                                        </div>
                                                    )}
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-slate-800/20 flex items-center justify-center">
                                                            <CheckIcon size={18} className="text-white drop-shadow" />
                                                        </div>
                                                    )}
                                                    {!opt.inStock && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-full h-px bg-red-400 rotate-45 absolute" />
                                                        </div>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    /* Text pill selector */
                                    <div className="flex flex-wrap gap-2">
                                        {group.options?.map(opt => {
                                            const isSelected = selectedOptions[group.label] === opt.label
                                            return (
                                                <button key={opt.id} type="button"
                                                    onClick={() => setSelectedOptions(p => ({ ...p, [group.label]: opt.label }))}
                                                    disabled={!opt.inStock}
                                                    className={`px-3.5 py-1.5 rounded-lg text-sm border-2 font-medium transition ${
                                                        isSelected
                                                            ? "border-slate-800 bg-slate-800 text-white"
                                                            : "border-slate-200 text-slate-600 hover:border-slate-400"
                                                    } ${!opt.inStock ? "opacity-40 cursor-not-allowed line-through" : ""}`}>
                                                    {opt.label}
                                                    {opt.priceModifier !== 0 && (
                                                        <span className={`text-xs ml-1 ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                                                            {opt.priceModifier > 0 ? "+" : ""}{opt.priceModifier.toLocaleString()}
                                                        </span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Shipping & delivery info panel */}
                <div className={`rounded-xl border p-4 mb-6 space-y-2.5 ${isAbroad ? 'border-blue-100 bg-blue-50/60' : 'border-slate-100 bg-slate-50'}`}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Shipping & Delivery</p>
                    {product.madeIn && (
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            MADE IN {String(product.madeIn).toUpperCase()}
                        </p>
                    )}

                    <div className="flex items-center gap-3 text-sm text-slate-700">
                        <TruckIcon size={15} className={isAbroad ? 'text-blue-500' : 'text-slate-400'} />
                        <span>
                            <span className="font-medium">{isAbroad ? '✈️ Shipped from Abroad' : '🏠 Local Product'}</span>
                            <span className="text-slate-500"> · {currency}{shippingFee.toLocaleString()} shipping fee</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <ClockIcon size={15} className="text-slate-400" />
                        <span>Estimated delivery: <span className="font-medium">{eta}</span></span>
                    </div>

                    {isAbroad ? (
                        <div className="flex items-center gap-3 text-sm text-blue-700">
                            <BanIcon size={15} className="text-blue-400" />
                            <span>Cash on Delivery <span className="font-semibold">not available</span> for internationally shipped items</span>
                        </div>
                    ) : acceptsCod ? (
                        <div className="flex items-center gap-3 text-sm text-green-700">
                            <CreditCardIcon size={15} className="text-green-400" />
                            <span>COD available · Pay online or on delivery</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-sm text-amber-800">
                            <BanIcon size={15} className="text-amber-500" />
                            <span>Cash on Delivery is <span className="font-semibold">disabled</span> for this product by the seller · Online payment only</span>
                        </div>
                    )}
                </div>

                {/* Add to cart */}
                <div className="flex items-end gap-5">
                    {(isVariantProduct ? exactVariantQuantity > 0 : productQuantity > 0) && (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold text-slate-700">Quantity</p>
                            <Counter productId={productId} variants={isVariantProduct ? normalizeVariants(selectedOptions) : {}} />
                        </div>
                    )}
                    <button
                        onClick={() => (!isVariantProduct && productQuantity > 0) ? router.push('/cart') : handleAddToCart()}
                        className={`px-10 py-3 text-sm font-medium rounded-lg transition active:scale-95 ${
                            !canAddToCart && (!isVariantProduct || productQuantity === 0)
                                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                : "bg-slate-800 text-white hover:bg-slate-900"
                        }`}>
                        {isVariantProduct
                            ? exactVariantQuantity > 0 ? 'Add one more' : 'Add to Cart'
                            : productQuantity > 0 ? 'View Cart' : 'Add to Cart'
                        }
                    </button>
                </div>

                <hr className="border-slate-200 my-5" />

                {/* Trust badges */}
                <div className="flex flex-col gap-3 text-slate-500 text-sm">
                    <p className="flex gap-3 items-center"><CreditCardIcon size={15} className="text-slate-400" /> 100% Secured Payment</p>
                    <p className="flex gap-3 items-center"><UserIcon size={15} className="text-slate-400" /> Trusted by thousands of buyers</p>
                    {product.tags?.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                            <TagIcon size={14} className="text-slate-400" />
                            {product.tags.map(tag => (
                                <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
