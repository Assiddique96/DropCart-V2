import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import authSeller from "@/middlewares/authSeller";
import { defaultLimiter } from "@/lib/rateLimit";
import { createNotification } from "@/lib/serverNotifications";

/**
 * POST /api/store/fulfill
 * Seller marks specific quantities of items as fulfilled.
 * Body: { orderId, items: [{ productId, fulfilledQuantity }] }
 *
 * When all items are fully fulfilled, order auto-advances to DELIVERED.
 */
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId, request.headers.get("x-store-id"));
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId, items } = await request.json();

    if (!orderId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "orderId and items array are required." }, { status: 400 });
    }

    // Verify order belongs to this store
    const order = await prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: { orderItems: true },
    });

    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    if (["DELIVERED", "CANCELLED"].includes(order.status)) {
      return NextResponse.json(
        { error: "Cannot update fulfillment for a delivered or cancelled order." },
        { status: 409 }
      );
    }

    // Update each item's fulfilled quantity
    const updatePromises = items.map(({ productId, fulfilledQuantity }) => {
      const orderItem = order.orderItems.find(i => i.productId === productId);
      if (!orderItem) return null;

      const clamped = Math.min(Math.max(0, parseInt(fulfilledQuantity)), orderItem.quantity);

      return prisma.orderItem.update({
        where: { orderId_productId: { orderId, productId } },
        data: { fulfilledQuantity: clamped },
      });
    }).filter(Boolean);

    await Promise.all(updatePromises);

    // Re-fetch updated items to check if fully fulfilled
    const updatedItems = await prisma.orderItem.findMany({ where: { orderId } });
    const fullyFulfilled = updatedItems.every(i => i.fulfilledQuantity >= i.quantity);
    const partiallyFulfilled = updatedItems.some(i => i.fulfilledQuantity > 0);

    let newStatus = order.status;
    if (fullyFulfilled) {
      newStatus = "DELIVERED";
    } else if (partiallyFulfilled && order.status === "ORDER_PLACED") {
      newStatus = "PROCESSING";
    }

    if (newStatus !== order.status) {
      const data = { status: newStatus };
      if (newStatus === "DELIVERED" && order.paymentMethod === "COD") {
        data.isPaid = true;
      }
      await prisma.order.update({ where: { id: orderId }, data });

      await createNotification({
        userId: order.userId,
        type: "order",
        title: newStatus === "DELIVERED" ? "Order delivered" : "Order processing",
        message:
          newStatus === "DELIVERED"
            ? "Your order has been delivered."
            : "Your order is now being processed.",
        link: "/orders",
      });
    }

    return NextResponse.json({
      message: fullyFulfilled
        ? "All items fulfilled. Order marked as DELIVERED."
        : "Fulfillment updated.",
      fullyFulfilled,
      newStatus,
    });
  } catch (error) {
    console.error("Fulfillment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
