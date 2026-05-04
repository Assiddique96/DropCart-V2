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
        <div className="relative aspect-[4/5] w-full rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
          {mainImage && (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              priority
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 480px"
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

      {/* Lightbox */}
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
      <div className="flex-1">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800 dark:text-white">
              {product.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-500 dark:text-slate-300">
              {product.description?.slice(0, 130)}
              {product.description?.length > 130 ? "..." : ""}
            </p>
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
            {product.madeIn && (
              <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                Made in {product.madeIn}
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                product.inStock
                  ? "border border-green-200 bg-green-50 text-green-700 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300"
                  : "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
              }`}
            >
              {product.inStock ? "In stock" : "Out of stock"}
            </span>
            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {isAbroad ? "International" : "Local"} ship
            </span>
            {acceptsCod && !isAbroad && (
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300">
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
                      avgRating >= i + 1 ? "#00C950" : "#4B5563"
                    }
                  />
                ))}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {product.rating?.length || 0} review
              {(product.rating?.length || 0) !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Price */}
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-3xl font-semibold text-slate-900 dark:text-white">
              {currency}
              {effectivePrice.toLocaleString()}
            </p>
            {product.mrp > product.price && (
              <p className="text-lg text-slate-400 dark:text-slate-500 line-through">
                {currency}
                {product.mrp.toLocaleString()}
              </p>
            )}
            {product.mrp > product.price && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-300">
                Save{" "}
                {(
                  ((product.mrp - product.price) / product.mrp) *
                  100
                ).toFixed(0)}
                %
              </span>
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
        </div>

        {/* Variant selectors */}
        {variantGroups.length > 0 && (
          <div className="mb-6 space-y-4">
            {variantGroups.map((group) => (
              <div key={group.id}>
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {group.label}
                  {group.required && (
                    <span className="text-red-400">*</span>
                  )}
                  {selectedOptions[group.label] && (
                    <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">
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
                          className={`group/swatch relative overflow-hidden rounded-lg border-2 transition ${
                            isSelected
                              ? "border-slate-800 dark:border-slate-100 shadow-md"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-400"
                          } ${
                            !opt.inStock
                              ? "cursor-not-allowed opacity-40"
                              : ""
                          }`}
                        >
                          {opt.image ? (
                            <img
                              src={opt.image}
                              alt={opt.label}
                              className="h-14 w-14 object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center bg-slate-100 dark:bg-slate-900 p-1 text-center text-xs leading-tight text-slate-500 dark:text-slate-300">
                              {opt.label}
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-800/20">
                              <CheckIcon
                                size={18}
                                className="text-white drop-shadow"
                              />
                            </div>
                          )}
                          {!opt.inStock && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="absolute h-px w-full rotate-45 bg-red-400" />
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
                          className={`rounded-lg border-2 px-3.5 py-1.5 text-sm font-medium transition ${
                            isSelected
                              ? "border-slate-800 bg-slate-800 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                              : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-400"
                          } ${
                            !opt.inStock
                              ? "cursor-not-allowed opacity-40 line-through"
                              : ""
                          }`}
                        >
                          {opt.label}
                          {opt.priceModifier !== 0 && (
                            <span
                              className={`ml-1 text-xs ${
                                isSelected
                                  ? "text-slate-300 dark:text-slate-700"
                                  : "text-slate-400 dark:text-slate-500"
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
          className={`mb-6 space-y-2.5 rounded-xl border p-4 ${
            isAbroad
              ? "border-blue-100 bg-blue-50/60 dark:border-blue-500/40 dark:bg-blue-500/10"
              : "border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
          }`}
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
            Shipping & Delivery
          </p>
          {product.madeIn && (
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-200">
              MADE IN {String(product.madeIn).toUpperCase()}
            </p>
          )}
          {product.manufacturer && (
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-200">
              BY {String(product.manufacturer).toUpperCase()}
            </p>
          )}

          <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
            <TruckIcon
              size={15}
              className={isAbroad ? "text-blue-500" : "text-slate-400"}
            />
            <span>
              <span className="font-medium">
                {isAbroad ? "✈️ Shipped from Abroad" : "🏠 Local Product"}
              </span>
              <span className="text-slate-500 dark:text-slate-300">
                {" "}
                · {currency}
                {shippingFee.toLocaleString()} shipping fee
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-200">
            <ClockIcon size={15} className="text-slate-400" />
            <span>
              Estimated delivery:{" "}
              <span className="font-medium">{eta}</span>
            </span>
          </div>

          {isAbroad ? (
            <div className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
              <BanIcon size={15} className="text-blue-400" />
              <span>
                Cash on Delivery{" "}
                <span className="font-semibold">
                  not available
                </span>{" "}
                for internationally shipped items
              </span>
            </div>
          ) : acceptsCod ? (
            <div className="flex items-center gap-3 text-sm text-green-700 dark:text-green-300">
              <CreditCardIcon size={15} className="text-green-400" />
              <span>COD available · Pay online or on delivery</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-amber-800 dark:text-amber-300">
              <BanIcon size={15} className="text-amber-500" />
              <span>
                Cash on Delivery is{" "}
                <span className="font-semibold">disabled</span> for
                this product by the seller · Online payment only
              </span>
            </div>
          )}
        </div>

        {/* Add to cart */}
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
            className={`rounded-lg px-10 py-3 text-sm font-medium transition active:scale-95 ${
              !canAddToCart &&
              (!isVariantProduct || productQuantity === 0)
                ? "cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
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

        <hr className="my-5 border-slate-200 dark:border-slate-800" />

        {/* Trust badges */}
        <div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-300">
          <p className="flex items-center gap-3">
            <CreditCardIcon
              size={15}
              className="text-slate-400 dark:text-slate-500"
            />{" "}
            100% Secured Payment
          </p>
          <p className="flex items-center gap-3">
            <UserIcon
              size={15}
              className="text-slate-400 dark:text-slate-500"
            />{" "}
            Trusted by thousands of buyers
          </p>
          {product.tags?.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <TagIcon
                size={14}
                className="text-slate-400 dark:text-slate-500"
              />
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-200"
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
