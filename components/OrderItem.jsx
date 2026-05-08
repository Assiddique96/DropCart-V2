"use client";
import Image from "next/image";
import { DotIcon } from "lucide-react";
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";

const OrderItem = ({ order }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";
  const [ratingModal, setRatingModal] = useState(null);

  const { ratings } = useSelector((state) => state.rating);

  return (
    <>
      <tr className="text-sm text-slate-700 dark:text-slate-100">
        <td className="text-left align-top">
          <div className="flex flex-col gap-6">
            {order.orderItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4"
              >
                <div className="w-20 aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-md border border-slate-100 dark:border-slate-700">
                  <Image
                    className="h-14 w-auto"
                    src={item.product.images[0]}
                    alt="product_img"
                    width={50}
                    height={50}
                  />
                </div>
                <div className="flex flex-col justify-center text-sm">
                  <p className="font-medium text-slate-600 dark:text-slate-100 text-base">
                    {item.product.name}
                  </p>
                  <p className="text-slate-700 dark:text-slate-200">
                    {currency}
                    {item.price} Qty : {item.quantity}{" "}
                  </p>
                  <p className="mb-1 text-slate-500 dark:text-slate-400">
                    {new Date(order.createdAt).toDateString()}
                  </p>
                  <div>
                    {ratings.find(
                      (rating) =>
                        order.id === rating.orderId &&
                        item.product.id === rating.productId,
                    ) ? (
                      <Rating
                        value={
                          ratings.find(
                            (rating) =>
                              order.id === rating.orderId &&
                              item.product.id === rating.productId,
                          ).rating
                        }
                      />
                    ) : (
                      <button
                        onClick={() =>
                          setRatingModal({
                            orderId: order.id,
                            productId: item.product.id,
                          })
                        }
                        className={`text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition ${
                          order.status !== "DELIVERED" && "hidden"
                        }`}
                      >
                        Rate Product
                      </button>
                    )}
                  </div>
                  {ratingModal && (
                    <RatingModal
                      ratingModal={ratingModal}
                      setRatingModal={setRatingModal}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </td>

        <td className="text-center max-md:hidden text-slate-700 dark:text-slate-100">
          {currency}
          {order.total}
        </td>

        <td className="text-left max-md:hidden text-slate-600 dark:text-slate-300">
          <p>
            {order.address.name}, {order.address.street},
          </p>
          <p>
            {order.address.city}, {order.address.state},{" "}
            {order.address.zip}, {order.address.country},
          </p>
          <p>{order.address.phone}</p>
        </td>

        <td className="text-left space-y-2 text-sm max-md:hidden">
          <div
            className={`flex items-center justify-center gap-1 rounded-full p-1 ${
              order.status === "confirmed"
                ? "text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30"
                : order.status === "delivered"
                ? "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30"
                : "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800/60"
            }`}
          >
            <DotIcon size={10} className="scale-250" />
            {order.status.split("_").join(" ").toLowerCase()}
          </div>
        </td>
      </tr>

      {/* Mobile */}
      <tr className="md:hidden text-slate-700 dark:text-slate-200">
        <td colSpan={5}>
          <p>
            {order.address.name}, {order.address.street}
          </p>
          <p>
            {order.address.city}, {order.address.state},{" "}
            {order.address.zip}, {order.address.country}
          </p>
          <p>{order.address.phone}</p>
          <br />
          <div className="flex items-center">
            <span className="text-center mx-auto px-6 py-1.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {order.status.replace(/_/g, " ").toLowerCase()}
            </span>
          </div>
        </td>
      </tr>

      <tr>
        <td colSpan={4}>
          <div className="border-b border-slate-300 dark:border-slate-700 w-6/7 mx-auto" />
        </td>
      </tr>
    </>
  );
};

export default OrderItem;
