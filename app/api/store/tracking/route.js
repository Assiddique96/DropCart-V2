import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import authSeller from "@/middlewares/authSeller";
import { defaultLimiter } from "@/lib/rateLimit";
import { createNotification } from "@/lib/serverNotifications";

/**
 * POST /api/store/tracking
 * Tracking numbers are system-generated and not editable.
 * This endpoint exists for backwards compatibility with older seller UIs.
 * Body: { orderId }
 * - If the order has no tracking number, one is generated and status is set to SHIPPED.
 * - If the order already has a tracking number, the request is rejected (not editable).
 */
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId, request.headers.get("x-store-id"));
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
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

    if (order.trackingNumber) {
      return NextResponse.json(
        { error: "Tracking number is already assigned and cannot be edited." },
        { status: 409 }
      );
    }

    const TRACKING_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid confusing chars (0/O, 1/I)
    const generateTrackingNumber = (length = 6) => {
      let out = "";
      for (let i = 0; i < length; i++) {
        out += TRACKING_ALPHABET[Math.floor(Math.random() * TRACKING_ALPHABET.length)];
      }
      return out;
    };

    const generateUniqueTrackingNumber = async () => {
      for (let attempt = 0; attempt < 20; attempt++) {
        const candidate = generateTrackingNumber(6);
        const existing = await prisma.order.findFirst({
          where: { trackingNumber: candidate },
          select: { id: true },
        });
        if (!existing) return candidate;
      }
      throw new Error("Failed to generate unique tracking number");
    };

    const updateData = {
      trackingNumber: await generateUniqueTrackingNumber(),
      status: "SHIPPED",
    };

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    if (updateData.status === "SHIPPED") {
      await createNotification({
        userId: order.userId,
        type: "order",
        title: "Order shipped",
        message: "Your order is on the way. A tracking number has been generated.",
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
