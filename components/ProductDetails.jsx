"use client";
import { addToCart } from "@/lib/features/cart/cartSlice";
import toast from "react-hot-toast";
import {
  StarIcon,
  TagIcon,
  CreditCardIcon,
  UserIcon,
  TruckIcon,
  ClockIcon,
  BanIcon,
  CheckIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ZoomInIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

const normalizeVariants = (variants = {}) => {
  return Object.keys(variants)
    .sort()
    .reduce((acc, key) => {
      acc[key] = variants[key];
      return acc;
    }, {});
};

const areVariantsEqual = (a = {}, b = {}) => {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(
    (key, index) =>
      key === bKeys[index] && String(a[key]) === String(b[key])
  );
};

const ProductDetails = ({ product }) => {
  const productId = product.id;
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₦";
  const isAbroad = product.origin === "ABROAD";
  const acceptsCod = !isAbroad && product.acceptCod !== false;

  const { items: cartItems, cartItems: cartSummary } = useSelector(
    (state) => state.cart
  );
  const dispatch = useDispatch();
  const router = useRouter();

  const images = (product.images || []).filter(Boolean);
  const [mainIdx, setMainIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomHover, setZoomHover] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const swipeStart = useRef(0);
  const swipeBlockedClick = useRef(false);

  const mainImage =
    images[Math.min(mainIdx, Math.max(0, images.length - 1))] ||
    images[0];
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    setMainIdx(0);
  }, [product.id]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (!images.length) return;
      if (e.key === "ArrowLeft")
        setMainIdx((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight")
        setMainIdx((i) => (i + 1) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, images.length]);

  const goThumb = (idx) => setMainIdx(idx);

  const onMainPointerDown = (e) => {
    swipeStart.current = e.clientX;
  };
  const onMainPointerUp = (e) => {
    if (images.length <= 1) return;
    const dx = e.clientX - swipeStart.current;
    if (Math.abs(dx) > 45) {
      swipeBlockedClick.current = true;
      setMainIdx((i) => {
        const len = images.length;
        return dx < 0 ? (i + 1) % len : (i - 1 + len) % len;
      });
    }
  };
  const openZoom = () => {
    if (swipeBlockedClick.current) {
      swipeBlockedClick.current = false;
      return;
    }
    setLightboxOpen(true);
  };

  useEffect(() => {
    if (lightboxOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [lightboxOpen]);

  const variantGroups = product.variantGroups || [];

  const priceModifierTotal = variantGroups.reduce((sum, group) => {
    const selected = group.options?.find(
      (o) => o.label === selectedOptions[group.label]
    );
    return sum + (selected?.priceModifier ?? 0);
  }, 0);
  const effectivePrice = product.price + priceModifierTotal;

  const requiredGroups = variantGroups.filter((g) => g.required);
  const allRequiredSelected = requiredGroups.every(
    (g) => selectedOptions[g.label]
  );
  const canAddToCart =
    variantGroups.length === 0 || allRequiredSelected;

  const exactCartItem = cartItems.find(
    (item) =>
      item.productId === productId &&
      areVariantsEqual(item.variants, selectedOptions)
  );
  const exactVariantQuantity = exactCartItem?.quantity ?? 0;
  const productQuantity = cartSummary[productId] || 0;
  const isVariantProduct = variantGroups.length > 0;

  const handleAddToCart = () => {
    if (!canAddToCart) {
      const missing = requiredGroups
        .filter((g) => !selectedOptions[g.label])
        .map((g) => g.label);
      toast.error(`Please select: ${missing.join(", ")}`);
      return;
    }
    addToCartHandler();
  };

  const [shippingFees, setShippingFees] = useState({
    local: 7000,
    abroad: 15000,
  });

  useEffect(() => {
    axios
      .get("/api/config")
      .then(({ data }) => {
        setShippingFees({
          local: data.shipping_base_fee ?? 7000,
          abroad: data.shipping_abroad_fee ?? 15000,
        });
      })
      .catch(() => {});
  }, []);

  const addToCartHandler = () =>
    dispatch(
      addToCart({
        productId,
        variants: normalizeVariants(selectedOptions),
      })
    );

  const avgRating = product.rating?.length
    ? product.rating.reduce(
        (acc, item) => acc + item.rating,
        0
      ) / product.rating.length
    : 0;

  const shippingFee = isAbroad
    ? shippingFees.abroad
    : shippingFees.local;
  const eta = isAbroad ? "20 – 25 days" : "7 – 10 days";

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      {/* Image gallery */}
      <div className="grid gap-4">
        {/* Main image constrained to ~500px */}
        <div className="flex justify-center">
          <div
            className="relative w-full max-w-[500px] rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
            onPointerDown={onMainPointerDown}
            onPointerUp={onMainPointerUp}
          >
            {mainImage && (
              <Image
                src={mainImage}
                alt={product.name}
                width={500}
                height={625} // keeps a 4:5 feel
                className="h-auto w-full object-contain"
                sizes="(max-width: 1024px) 100vw, 500px"
                priority
              />
            )}
            {isAbroad && (
              <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow pointer-events-none">
                ✈️ Shipped from Abroad
              </div>
            )}
            {images.length > 1 && (
              <button
                type="button"
                onClick={openZoom}
                className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow hover:bg-white dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                <ZoomInIcon size={14} /> View
              </button>
            )}
          </div>
        </div>

        {images.length > 1 && (
          <div className="grid grid-cols-2 gap-3">
            {images.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goThumb(index)}
                className={`relative aspect-square rounded-3xl overflow-hidden border transition ${
                  index ===
                  Math.min(mainIdx, Math.max(0, images.length - 1))
                    ? "border-slate-800 dark:border-slate-100 shadow-lg"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-500"
                }`}
              >
                <Image
                  src={image}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 240px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox (full-screen view) */}
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
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            aria-label="Close"
          >
            <XIcon size={22} />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"
                onClick={(e) => {
                  e.stopPropagation();
                  setMainIdx(
                    (i) => (i - 1 + images.length) % images.length
                  );
                }}
                aria-label="Previous"
              >
                <ChevronLeftIcon size={28} />
              </button>
              <button
                type="button"
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"
                onClick={(e) => {
                  e.stopPropagation();
                  setMainIdx((i) => (i + 1) % images.length);
                }}
                aria-label="Next"
              >
                <ChevronRightIcon size={28} />
              </button>
            </>
          )}
          <div
            className="relative h-full w-full max-h-[90vh] max-w-[min(100vw,1200px)]"
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
      {/* ...rest of your component stays exactly the same... */}
    </div>
  );
};

export default ProductDetails;
