'use client'
import { useState, useEffect, useRef } from 'react'
import { setQuantity, deleteItemFromCart } from '@/lib/features/cart/cartSlice'
import { useDispatch } from 'react-redux'
import { Trash2Icon } from 'lucide-react'

const normalizeVariants = (variants = {}) =>
    Object.keys(variants).sort().reduce((acc, key) => { acc[key] = variants[key]; return acc }, {})

/**
 * WholesaleCounter — used in the cart for wholesale/bulk products.
 * Shows a direct numeric input (not a stepper). On change it resolves
 * the active tier and updates the cart quantity in one dispatch.
 *
 * Props:
 *   productId    string
 *   quantity     number   — current cart quantity (from parent)
 *   tiers        array    — ProductWholesaleTier[]  sorted by minQty asc
 *   variants     object   — selected variant map
 *   currency     string
 *   basePrice    number   — product.price (used when no tier matches)
 *   onTierChange fn(tier) — called with the active tier so parent can update subtotal
 */
const WholesaleCounter = ({
    productId,
    quantity,
    tiers = [],
    variants = {},
    currency = '₦',
    basePrice = 0,
    onTierChange,
}) => {
    const dispatch = useDispatch()
    const [inputVal, setInputVal] = useState(String(quantity))
    const inputRef = useRef(null)

    // Keep input in sync if cart quantity changes from outside
    useEffect(() => {
        setInputVal(String(quantity))
    }, [quantity])

    const resolveTier = (qty) => {
        if (!tiers.length) return null
        return tiers
            .filter(t => t.minQty <= qty && (t.maxQty == null || qty <= t.maxQty))
            .sort((a, b) => b.minQty - a.minQty)[0] ?? null
    }

    const activeTier = resolveTier(quantity)

    const commit = (raw) => {
        const qty = Math.max(1, parseInt(raw, 10) || 1)
        setInputVal(String(qty))
        dispatch(setQuantity({ productId, variants: normalizeVariants(variants), quantity: qty }))
        const tier = resolveTier(qty)
        onTierChange?.(tier)
    }

    const handleChange = (e) => {
        // Allow free typing; only clamp on blur/enter
        setInputVal(e.target.value)
    }

    const handleBlur = () => commit(inputVal)

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(inputVal) }
    }

    const handleDelete = () => {
        dispatch(deleteItemFromCart({ productId, variants: normalizeVariants(variants) }))
    }

    // Tier badge color
    const tierColor = activeTier
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700'
        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'

    const unitPrice = activeTier ? activeTier.price : basePrice

    return (
        <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
            {/* Quantity input */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                    type="button"
                    onClick={() => commit(quantity - 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition select-none text-base leading-none"
                >
                    −
                </button>
                <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    value={inputVal}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-14 text-center py-1.5 text-sm font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 outline-none border-x border-slate-200 dark:border-slate-700 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                    type="button"
                    onClick={() => commit(quantity + 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition select-none text-base leading-none"
                >
                    +
                </button>
                <button
                    type="button"
                    onClick={handleDelete}
                    className="px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    title="Remove from cart"
                >
                    <Trash2Icon size={14} />
                </button>
            </div>

            {/* Active tier badge */}
            {tiers.length > 0 && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${tierColor}`}>
                    {activeTier
                        ? `📦 ${currency}${unitPrice.toLocaleString()}/pc · ${activeTier.minQty}${activeTier.maxQty != null ? `–${activeTier.maxQty}` : '+'}pcs`
                        : `Base price applies`
                    }
                </span>
            )}
        </div>
    )
}

export default WholesaleCounter
