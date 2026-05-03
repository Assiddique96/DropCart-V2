'use client'
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const normalizeVariants = (variants = {}) => {
    return Object.keys(variants).sort().reduce((acc, key) => {
        acc[key] = variants[key];
        return acc;
    }, {});
};

const sameVariants = (a = {}, b = {}) => {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key, index) => key === bKeys[index] && String(a[key]) === String(b[key]));
};

const Counter = ({ productId, variants = {} }) => {
    const { items, cartItems } = useSelector(state => state.cart);
    const dispatch = useDispatch();

    const exactItem = items.find(item => item.productId === productId && sameVariants(item.variants, variants));
    const quantity = exactItem ? exactItem.quantity : (cartItems[productId] || 0);

    const addToCartHandler = () => {
        dispatch(addToCart({ productId, variants: normalizeVariants(variants) }))
    }

    const removeFromCartHandler = () => {
        dispatch(removeFromCart({ productId, variants: normalizeVariants(variants) }))
    }

    return (
        <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600">
            <button onClick={removeFromCartHandler} className="p-1 select-none">-</button>
            <p className="p-1">{quantity}</p>
            <button onClick={addToCartHandler} className="p-1 select-none">+</button>
        </div>
    )
}

export default Counter