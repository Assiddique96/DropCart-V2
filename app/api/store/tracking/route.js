import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import authSeller from "@/middlewares/authSeller";
import { defaultLimiter } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/sanitize";
import { createNotification } from "@/lib/serverNotifications";

/**
 * POST /api/store/tracking
 * Seller assigns a tracking number to an order.
 * Body: { orderId, trackingNumber }
 * Optionally auto-advances status to SHIPPED if still PROCESSING.
 */
export async function POST(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId, trackingNumber: rawTracking } = await request.json();
    const trackingNumber = sanitizeString(rawTracking, 200);

    if (!orderId || !trackingNumber) {
      return NextResponse.json({ error: "Order ID and tracking number are required." }, { status: 400 });
    }

    // Verify order belongs to this store
    const order = await prisma.order.findFirst({ where: { id: orderId, storeId } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    if (["DELIVERED", "CANCELLED"].includes(order.status)) {
      return NextResponse.json(
        { error: "Cannot update tracking for a delivered or cancelled order." },
        { status: 409 }
      );
    }

    const updateData = { trackingNumber };

    // Auto-advance to SHIPPED when tracking is added
    if (["ORDER_PLACED", "PROCESSING"].includes(order.status)) {
      updateData.status = "SHIPPED";
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    if (updateData.status === "SHIPPED") {
      await createNotification({
        userId: order.userId,
        type: "order",
        title: "Order shipped",
        message: "Your order is on the way. Tracking information has been added.",
        link: "/orders",
      });
    }

    // Fire shipping notification if we advanced status
    if (updateData.status === "SHIPPED") {
      try {
        const { inngest } = await import("@/inngest/client");
        const buyer = await prisma.user.findUnique({ where: { id: order.userId }, select: { name: true, email: true } });
        const store = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true } });
        if (buyer && store) {
          await inngest.send({
            name: "app/order.shipped",
            data: { orderId, userEmail: buyer.email, userName: buyer.name, storeName: store.name },
          });
        }
      } catch (notifErr) {
        console.error("Tracking notification error (non-fatal):", notifErr);
      }
    }

    return NextResponse.json({ message: "Tracking number saved.", order: updated });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
