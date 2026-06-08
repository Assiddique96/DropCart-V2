"use client";
import { addToCart, setQuantity } from "@/lib/features/cart/cartSlice";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

const normalizeVariants = (variants = {}) =>
  Object.keys(variants)
    .sort()
    .reduce((acc, key) => {
      acc[key] = variants[key];
      return acc;
    }, {});

const areVariantsEqual = (a = {}, b = {}) => {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(
    (key, index) =>
      key === bKeys[index] && String(a[key]) === String(b[key]),
  );
};

const ProductDetails = ({ product }) => {
  const productId = product.id;
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₦";
  const isAbroad = product.origin === "ABROAD";
  const acceptsCod = !isAbroad && product.acceptCod !== false;

  const { items: cartItems, cartItems: cartSummary } = useSelector(
    (state) => state.cart,
  );
  const dispatch = useDispatch();
  const router = useRouter();

  const images = (product.images || []).filter(Boolean);
  const [mainIdx, setMainIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const swipeStart = useRef(0);
  const swipeBlockedClick = useRef(false);

  const mainImage =
    images[
      Math.min(mainIdx, Math.max(0, images.length - 1))
    ] || images[0];

  const [selectedOptions, setSelectedOptions] = useState({});
  const [shippingFees, setShippingFees] = useState({
    local: 7000,
    abroad: 15000,
  });
  // Wholesale: buyer types a quantity before adding to cart
  const [wholesaleQty, setWholesaleQty] = useState(1);

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

  const variantGroups = product.variantGroups || [];

  const priceModifierTotal = variantGroups.reduce((sum, group) => {
    const selected = group.options?.find(
      (o) => o.label === selectedOptions[group.label],
    );
    return sum + (selected?.priceModifier ?? 0);
  }, 0);
  const effectivePrice = product.price + priceModifierTotal;

  // Wholesale tier resolution
  const wholesaleTiers = product.wholesaleTiers ?? [];
  const isWholesale = product.isWholesale && wholesaleTiers.length > 0;

  const resolveWholesaleTier = (qty) => {
    if (!isWholesale) return null;
    return wholesaleTiers
      .filter(t => t.minQty <= qty && (t.maxQty == null || qty <= t.maxQty))
      .sort((a, b) => b.minQty - a.minQty)[0] ?? null;
  };

  const activeWholesaleTier = resolveWholesaleTier(wholesaleQty);
  const displayPrice = (activeWholesaleTier?.price ?? product.price) + priceModifierTotal;
  const wholesaleSubtotal = displayPrice * wholesaleQty;

  const requiredGroups = variantGroups.filter((g) => g.required);
  const allRequiredSelected = requiredGroups.every(
    (g) => selectedOptions[g.label],
  );
  const canAddToCart =
    variantGroups.length === 0 || allRequiredSelected;

  const exactCartItem = cartItems.find(
    (item) =>
      item.productId === productId &&
      areVariantsEqual(item.variants, selectedOptions),
  );
  const exactVariantQuantity = exactCartItem?.quantity ?? 0;
  const productQuantity = cartSummary[productId] || 0;
  const isVariantProduct = variantGroups.length > 0;

  const selectedVariantStock = variantGroups.length > 0
    ? variantGroups.reduce((minQty, group) => {
        const selected = selectedOptions[group.label];
        if (!selected) return minQty;
        const option = group.options?.find((o) => o.label === selected);
        return option ? Math.min(minQty, option.quantity ?? minQty) : minQty;
      }, Infinity)
    : Infinity;
  const availableStock = Number.isFinite(selectedVariantStock)
    ? selectedVariantStock
    : product.quantity ?? 0;
  const isLowStock = availableStock > 0 && availableStock <= 5;

  const handleAddToCart = () => {
    if (!canAddToCart) {
      const missing = requiredGroups
        .filter((g) => !selectedOptions[g.label])
        .map((g) => g.label);
      toast.error(`Please select: ${missing.join(", ")}`);
      return;
    }
    if (isWholesale) {
      const qty = Math.max(1, wholesaleQty);
      dispatch(
        setQuantity({
          productId,
          variants: normalizeVariants(selectedOptions),
          quantity: qty,
        }),
      );
      toast.success(`${qty} × ${product.name} added to cart`);
    } else {
      dispatch(
        addToCart({
          productId,
          variants: normalizeVariants(selectedOptions),
        }),
      );
    }
  };

  const avgRating = product.rating?.length
    ? product.rating.reduce(
        (acc, item) => acc + item.rating,
        0,
      ) / product.rating.length
    : 0;

  const stateLabel = product.store?.deliveryStates?.length
    ? product.store.deliveryStates.join(", ")
    : product.store?.state || "seller's state";
  const countryLabel = product.store?.country || "Nigeria";
  const withinStateFee = product.store?.shippingLocalFee ?? shippingFees.local;
  const nationwideFee = product.store?.shippingNationwideFee ?? withinStateFee;
  const internationalFee = product.store?.shippingAbroadFee ?? shippingFees.abroad;

  const shippingFee = isAbroad
    ? internationalFee
    : product.deliveryWithinState
    ? withinStateFee
    : product.deliveryNationwide
    ? nationwideFee
    : withinStateFee;
  const eta = isAbroad ? "20 – 25 days" : "7 – 10 days";

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] text-slate-800 dark:text-slate-100">
      {/* Image gallery */}
      <div className="grid gap-4 max-w-[600px]">
        <div
          className="relative aspect-[4/3] w-full max-h-[520px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 cursor-pointer"
          onClick={openZoom}
        >
          {mainImage && (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 560px"
            />
          )}
          {isAbroad && (
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow pointer-events-none">
              ✈️ Shipped from Abroad
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goThumb(index)}
                className={`relative h-16 overflow-hidden rounded-lg border-2 transition-all ${
                  index ===
                  Math.min(mainIdx, Math.max(0, images.length - 1))
                    ? "border-blue-500 shadow-md ring-2 ring-blue-100"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                }`}
              >
                <Image
                  src={image}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 14vw, 80px"
                />
              </button>
            ))}
          </div>
        )}
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
                    (i) => (i - 1 + images.length) % images.length,
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
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-50">
              {product.name}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {product.category}
            </span>
            {product.manufacturer && (
              <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {product.manufacturer}
              </span>
            )}
            {product.material && (
              <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                Material: {product.material}
              </span>
            )}
            {product.madeIn && (
              <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                Made in {product.madeIn}
              </span>
            )}
            {product.guaranteePeriod && (
              <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                Guarantee: {product.guaranteePeriod}
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                product.inStock
                  ? "border border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300"
                  : "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
              }`}
            >
              {product.inStock ? "In stock" : "Out of stock"}
            </span>
            {product.inStock && (
              <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {availableStock} unit{availableStock === 1 ? "" : "s"} available
              </span>
            )}
            {isLowStock && (
              <span className="rounded-full border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300 px-3 py-1 text-xs font-semibold">
                Low stock
              </span>
            )}
            {typeof product._count?.orderItems === 'number' && (
              <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                Sold {product._count.orderItems} {product._count.orderItems === 1 ? 'time' : 'times'}
              </span>
            )}
            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {isAbroad ? "International" : "Local"} ship
            </span>
            {acceptsCod && !isAbroad && (
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
                COD available
              </span>
            )}
          </div>

          {/* Ratings */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array(5)
                .fill("")
                .map((_, i) => (
                  <StarIcon
                    key={i}
                    size={14}
                    className="text-transparent"
                    fill={
                      avgRating >= i + 1 ? "#00C950" : "#D1D5DB"
                    }
                  />
                ))}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {product.rating?.length || 0} review
              {(product.rating?.length || 0) !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="mt-4 prose max-w-2xl text-slate-700 dark:text-slate-200">
            <div
              dangerouslySetInnerHTML={{
                __html: product.description || "",
              }}
            />
          </div>

          {/* Price */}
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
              {currency}
              {displayPrice.toLocaleString()}
              {isWholesale && (
                <span className="text-base font-normal text-slate-400 dark:text-slate-500 ml-1">/pc</span>
              )}
            </p>
            {product.mrp > product.price && (
              <>
                <p className="text-lg text-slate-400 line-through">
                  {currency}
                  {product.mrp.toLocaleString()}
                </p>
                <span className="text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full">
                  Save{" "}
                  {(
                    ((product.mrp - product.price) /
                      product.mrp) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </>
            )}
            {priceModifierTotal !== 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Base price {currency}
                {product.price.toLocaleString()}{" "}
                {priceModifierTotal > 0 ? "+" : ""}
                {priceModifierTotal.toLocaleString()}
              </span>
            )}
          </div>
          {/* Wholesale pricing table */}
          {isWholesale && (
            <div className="mt-4 border border-amber-200 dark:border-amber-800/60 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                  📦 Wholesale / Bulk Pricing
                </span>
                <span className="text-[10px] text-amber-500 dark:text-amber-400 ml-auto">
                  Price updates live as you change quantity
                </span>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="text-left p-2 pl-3 font-medium">Quantity</th>
                    <th className="text-left p-2 font-medium">Unit Price</th>
                    <th className="text-left p-2 font-medium">You Save</th>
                  </tr>
                </thead>
                <tbody>
                  {wholesaleTiers.map((tier, idx) => {
                    const isActive = activeWholesaleTier?.minQty === tier.minQty;
                    const saving = product.price - tier.price;
                    return (
                      <tr
                        key={tier.id ?? idx}
                        className={`border-t border-slate-100 dark:border-slate-800 transition-colors ${
                          isActive
                            ? "bg-amber-50 dark:bg-amber-900/25"
                            : ""
                        }`}
                      >
                        <td className="p-2 pl-3 text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          {isActive && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          )}
                          {tier.minQty}{tier.maxQty != null ? `–${tier.maxQty}` : "+"} pcs
                        </td>
                        <td className={`p-2 font-semibold ${isActive ? "text-amber-700 dark:text-amber-300" : "text-slate-800 dark:text-slate-100"}`}>
                          {currency}{tier.price.toLocaleString()}
                        </td>
                        <td className="p-2">
                          {saving > 0 ? (
                            <span className="text-green-600 dark:text-green-400">
                              -{currency}{saving.toLocaleString()}/pc
                            </span>
                          ) : (
                            <span className="text-slate-400">Base price</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-[10px] text-slate-400 px-3 py-2 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
                The highlighted row is your current tier based on the quantity entered above.
              </p>
            </div>
          )}
        </div>

        {/* Variant selectors */}
        {variantGroups.length > 0 && (
          <div className="space-y-4 mb-6">
            {variantGroups.map((group) => (
              <div key={group.id}>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1">
                  {group.label}
                  {group.required && (
                    <span className="text-red-400">*</span>
                  )}
                  {selectedOptions[group.label] && (
                    <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">
                      — {selectedOptions[group.label]}
                    </span>
                  )}
                </p>

                {group.type === "IMAGE" ? (
                  <div className="flex flex-wrap gap-2">
                    {group.options?.map((opt) => {
                      const isSelected =
                        selectedOptions[group.label] === opt.label;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setSelectedOptions((p) => ({
                              ...p,
                              [group.label]: opt.label,
                            }))
                          }
                          disabled={!opt.inStock}
                          title={
                            opt.label +
                            (opt.priceModifier
                              ? ` (${
                                  opt.priceModifier > 0 ? "+" : ""
                                }${opt.priceModifier.toLocaleString()})`
                              : "")
                          }
                          className={`relative rounded-lg border-2 overflow-hidden transition ${
                            isSelected
                              ? "border-slate-800 dark:border-slate-100 shadow-md"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                          } ${
                            !opt.inStock
                              ? "opacity-40 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {opt.image ? (
                            <img
                              src={opt.image}
                              alt={opt.label}
                              className="w-14 h-14 object-cover"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-500 dark:text-slate-300 p-1 text-center leading-tight">
                              {opt.label}
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute inset-0 bg-slate-800/20 flex items-center justify-center">
                              <CheckIcon
                                size={18}
                                className="text-white drop-shadow"
                              />
                            </div>
                          )}
                          {!opt.inStock && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-px bg-red-400 rotate-45 absolute" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {group.options?.map((opt) => {
                      const isSelected =
                        selectedOptions[group.label] === opt.label;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setSelectedOptions((p) => ({
                              ...p,
                              [group.label]: opt.label,
                            }))
                          }
                          disabled={!opt.inStock}
                          className={`px-3.5 py-1.5 rounded-lg text-sm border-2 font-medium transition ${
                            isSelected
                              ? "border-slate-800 bg-slate-800 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500"
                          } ${
                            !opt.inStock
                              ? "opacity-40 cursor-not-allowed line-through"
                              : ""
                          }`}
                        >
                          {opt.label}
                          {opt.priceModifier !== 0 && (
                            <span
                              className={`text-xs ml-1 ${
                                isSelected
                                  ? "text-slate-300 dark:text-slate-700"
                                  : "text-slate-400 dark:text-slate-400"
                              }`}
                            >
                              {opt.priceModifier > 0 ? "+" : ""}
                              {opt.priceModifier.toLocaleString()}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Shipping & delivery info panel */}
        <div
          className={`rounded-xl border p-4 mb-6 space-y-2.5 ${
            isAbroad
              ? "border-blue-100 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-900/15"
              : "border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40"
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Shipping & Delivery
          </p>
          {product.madeIn && (
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              MADE IN {String(product.madeIn).toUpperCase()}
            </p>
          )}
          {product.manufacturer && (
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              BY {String(product.manufacturer).toUpperCase()}
            </p>
          )}

          <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
            <TruckIcon
              size={15}
              className={
                isAbroad ? "text-blue-500" : "text-slate-400 dark:text-slate-500"
              }
            />
            <span>
              <span className="font-medium">
                {isAbroad ? "✈️ Shipped from Abroad" : "🏠 Local Product"}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {" "}
                · {currency}
                {shippingFee.toLocaleString()} shipping fee
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <ClockIcon
              size={15}
              className="text-slate-400 dark:text-slate-500"
            />
            <span>
              Estimated delivery:{" "}
              <span className="font-medium">{eta}</span>
            </span>
          </div>

          {!isAbroad ? (
            product.deliveryWithinState && !product.deliveryNationwide && !product.deliveryInternational ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                This product is only available for delivery for orders within {stateLabel}.
              </div>
            ) : (
              <div className="space-y-2 pt-2 text-sm text-slate-600 dark:text-slate-300">
                {product.deliveryWithinState && (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                    <span>Delivery within {stateLabel}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {withinStateFee === 0 ? "FREE" : `${currency}${withinStateFee.toLocaleString()}`}
                    </span>
                  </div>
                )}
                {product.deliveryNationwide && (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                    <span>Nationwide delivery</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {nationwideFee === 0 ? "FREE" : `${currency}${nationwideFee.toLocaleString()}`}
                    </span>
                  </div>
                )}
                {product.deliveryInternational && (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                    <span>International delivery</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {internationalFee === 0 ? "FREE" : `${currency}${internationalFee.toLocaleString()}`}
                    </span>
                  </div>
                )}
              </div>
            )
          ) : (
            product.deliveryInternational && (
              <div className="space-y-2 pt-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                  <span>International delivery</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {internationalFee === 0 ? "FREE" : `${currency}${internationalFee.toLocaleString()}`}
                  </span>
                </div>
              </div>
            )
          )}

          {isAbroad ? (
            <div className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
              <BanIcon
                size={15}
                className="text-blue-400 dark:text-blue-400"
              />
              <span>
                Cash on Delivery{" "}
                <span className="font-semibold">not available</span> for
                internationally shipped items
              </span>
            </div>
          ) : acceptsCod ? (
            <div className="flex items-center gap-3 text-sm text-green-700 dark:text-green-300">
              <CreditCardIcon
                size={15}
                className="text-green-400 dark:text-green-400"
              />
              <span>COD available · Pay online or on delivery</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-amber-800 dark:text-amber-300">
              <BanIcon
                size={15}
                className="text-amber-500 dark:text-amber-400"
              />
              <span>
                Cash on Delivery is{" "}
                <span className="font-semibold">disabled</span> for this
                product by the seller · Online payment only
              </span>
            </div>
          )}
        </div>

        {/* Add to cart */}
        {isWholesale ? (
          /* ── Wholesale add-to-cart ── */
          <div className="flex flex-col gap-4">
            {/* Quantity input with live tier feedback */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Order Quantity
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setWholesaleQty(q => Math.max(1, q - 1))}
                    className="px-3 py-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition select-none text-lg leading-none"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.quantity || undefined}
                    value={wholesaleQty}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      setWholesaleQty(isNaN(v) || v < 1 ? 1 : v);
                    }}
                    className="w-20 text-center py-2.5 text-base font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 outline-none border-x border-slate-200 dark:border-slate-700 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setWholesaleQty(q => q + 1)}
                    className="px-3 py-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition select-none text-lg leading-none"
                  >
                    +
                  </button>
                </div>

                {/* Live tier badge */}
                {activeWholesaleTier ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      📦 {currency}{activeWholesaleTier.price.toLocaleString()}/pc
                    </span>
                    <span className="text-[10px] text-amber-500 dark:text-amber-400">
                      ({activeWholesaleTier.minQty}{activeWholesaleTier.maxQty != null ? `–${activeWholesaleTier.maxQty}` : "+"} pcs tier)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Base price · no bulk tier matched
                    </span>
                  </div>
                )}
              </div>

              {/* Subtotal preview */}
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Subtotal:{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {currency}{wholesaleSubtotal.toLocaleString()}
                </span>
                <span className="text-xs ml-1">
                  ({wholesaleQty} × {currency}{displayPrice.toLocaleString()})
                </span>
              </p>
            </div>

            {/* Add to cart button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart || !product.inStock}
                className={`px-10 py-3 text-sm font-medium rounded-lg transition active:scale-95 ${
                  !canAddToCart || !product.inStock
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
                    : "bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                }`}
              >
                {!product.inStock ? "Out of Stock" : `Add ${wholesaleQty} to Cart`}
              </button>
              {exactVariantQuantity > 0 && (
                <button
                  onClick={() => router.push("/cart")}
                  className="px-6 py-3 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  View Cart ({exactVariantQuantity} in cart)
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── Regular add-to-cart ── */
          <div className="flex items-end gap-5">
            {(isVariantProduct
              ? exactVariantQuantity > 0
              : productQuantity > 0) && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Quantity
                </p>
                <Counter
                  productId={productId}
                  variants={
                    isVariantProduct
                      ? normalizeVariants(selectedOptions)
                      : {}
                  }
                />
              </div>
            )}
            <button
              onClick={() =>
                !isVariantProduct && productQuantity > 0
                  ? router.push("/cart")
                  : handleAddToCart()
              }
              className={`px-10 py-3 text-sm font-medium rounded-lg transition active:scale-95 ${
                !canAddToCart &&
                (!isVariantProduct || productQuantity === 0)
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
                  : "bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              }`}
            >
              {isVariantProduct
                ? exactVariantQuantity > 0
                  ? "Add one more"
                  : "Add to Cart"
                : productQuantity > 0
                ? "View Cart"
                : "Add to Cart"}
            </button>
          </div>
        )}

        <hr className="border-slate-200 dark:border-slate-700 my-5" />

        {/* Trust badges */}
        <div className="flex flex-col gap-3 text-slate-500 dark:text-slate-400 text-sm">
          <p className="flex gap-3 items-center">
            <CreditCardIcon
              size={15}
              className="text-slate-400 dark:text-slate-500"
            />{" "}
            100% Secured Payment
          </p>
          <p className="flex gap-3 items-center">
            <UserIcon
              size={15}
              className="text-slate-400 dark:text-slate-500"
            />{" "}
            Trusted by thousands of buyers
          </p>
          {product.tags?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <TagIcon
                size={14}
                className="text-slate-400 dark:text-slate-500"
              />
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
