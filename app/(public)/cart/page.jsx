"use client";
import Counter from "@/components/Counter";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
import { deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
// import { useTheme } from "@/app/providers/ThemeProvider"; // only if you want to read theme value

export default function Cart() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

  const { items: cartItems } = useSelector((state) => state.cart);
  const products = useSelector((state) => state.product.list);

  const dispatch = useDispatch();

  const [cartArray, setCartArray] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const getVariantPriceModifier = (product, variants = {}) => {
    if (!product?.variantGroups?.length || !variants || Object.keys(variants).length === 0) return 0;
    return product.variantGroups.reduce((sum, group) => {
      const optionLabel = variants[group.label];
      if (!optionLabel) return sum;
      const option = group.options?.find((o) => o.label === optionLabel);
      return sum + (option?.priceModifier ?? 0);
    }, 0);
  };

  const createCartArray = () => {
    let subtotal = 0;
    const mapped = cartItems
      .map((item) => {
        const product = products.find((product) => product.id === item.productId);
        if (!product) return null;
        const priceModifier = getVariantPriceModifier(product, item.variants);
        const unitPrice = product.price + priceModifier;
        subtotal += unitPrice * item.quantity;
        return {
          ...product,
          quantity: item.quantity,
          variants: item.variants,
          unitPrice,
          priceModifier,
        };
      })
      .filter(Boolean);
    setCartArray(mapped);
    setTotalPrice(subtotal);
  };

  const handleDeleteItemFromCart = (productId, variants = {}) => {
    dispatch(deleteItemFromCart({ productId, variants }));
  };

  useEffect(() => {
    if (products.length > 0) {
      createCartArray();
    }
  }, [cartItems, products]);

  return cartArray.length > 0 ? (
    <div className="min-h-screen mx-6 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <PageTitle
          heading="My Cart"
          text="items in your cart"
          linkText="Add more"
        />

        <div className="flex items-start justify-between gap-5 max-lg:flex-col">
          <table className="w-full max-w-4xl table-auto text-slate-700 dark:text-slate-100">
            <thead>
              <tr className="max-sm:text-sm border-b border-slate-200 dark:border-slate-800">
                <th className="text-left">Product</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th className="max-md:hidden">Remove</th>
              </tr>
            </thead>
            <tbody>
              {cartArray.map((item, index) => (
                <tr
                  key={index}
                  className="space-x-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <td className="flex gap-3 my-4">
                    <div className="flex gap-3 items-center justify-center bg-slate-100 dark:bg-slate-800 size-18 rounded-md">
                      <Image
                        src={item.images[0]}
                        className="h-14 w-auto"
                        alt={item.name}
                        width={45}
                        height={45}
                      />
                    </div>
                    <div>
                      <p className="max-sm:text-sm text-slate-800 dark:text-slate-50">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.category}
                      </p>
                      {item.variants &&
                        Object.keys(item.variants).length > 0 && (
                          <div className="text-xs text-slate-500 dark:text-slate-300 mt-1 space-y-1">
                            {Object.entries(item.variants).map(
                              ([group, option]) => (
                                <p key={group}>
                                  {group}:{" "}
                                  <span className="font-medium text-slate-700 dark:text-slate-100">
                                    {option}
                                  </span>
                                </p>
                              )
                            )}
                          </div>
                        )}
                      <p className="mt-2 text-slate-800 dark:text-slate-50">
                        {currency}
                        {item.unitPrice.toLocaleString()}
                      </p>
                    </div>
                  </td>
                  <td className="text-center">
                    <Counter productId={item.id} variants={item.variants} />
                  </td>
                  <td className="text-center text-slate-800 dark:text-slate-50">
                    {currency}
                    {(item.unitPrice * item.quantity).toLocaleString()}
                  </td>
                  <td className="text-center max-md:hidden">
                    <button
                      onClick={() =>
                        handleDeleteItemFromCart(item.id, item.variants)
                      }
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2.5 rounded-full active:scale-95 transition-all"
                    >
                      <Trash2Icon size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <OrderSummary totalPrice={totalPrice} items={cartArray} />
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-[80vh] mx-6 flex items-center justify-center bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-500">
      <h1 className="text-2xl sm:text-4xl font-semibold">
        Your cart is empty
      </h1>
    </div>
  );
}
