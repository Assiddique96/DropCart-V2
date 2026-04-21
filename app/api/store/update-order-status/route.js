import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import authSeller from "@/middlewares/authSeller";
import { inngest } from "@/inngest/client";
import { createNotification } from "@/lib/serverNotifications";

const TRACKING_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid confusing chars (0/O, 1/I)

function generateTrackingNumber(length = 6) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TRACKING_ALPHABET[Math.floor(Math.random() * TRACKING_ALPHABET.length)];
  }
  return out;
}

async function generateUniqueTrackingNumber() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = generateTrackingNumber(6);
    const existing = await prisma.order.findFirst({
      where: { trackingNumber: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("Failed to generate unique tracking number");
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { orderId, status } = await request.json();

    const storeId = await authSeller(userId);
    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.order.findFirst({ where: { id: orderId, storeId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found for your store" }, { status: 404 });
    }

    const data = { status };
    if (status === "DELIVERED" && order.paymentMethod === "COD") {
      data.isPaid = true;
    }

    // Auto-generate tracking number when seller marks as SHIPPED
    if (status === "SHIPPED" && !order.trackingNumber) {
      data.trackingNumber = await generateUniqueTrackingNumber();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data,
    });

    if (status !== order.status) {
      await createNotification({
        userId: order.userId,
        type: "order",
        title: `Order ${status.toLowerCase().replace(/_/g, " ")}`,
        message:
          status === "PROCESSING"
            ? "The store is preparing your order."
            : status === "SHIPPED"
              ? "Your order is on the way."
              : status === "DELIVERED"
                ? "Your order has been delivered."
                : status === "CANCELLED"
                  ? "Your order has been cancelled."
                  : `Your order status changed to ${status}.`,
        link: "/orders",
      });
    }

    // Fire shipping notification when status changes to SHIPPED
    if (status === "SHIPPED" && order.status !== "SHIPPED") {
      try {
        const buyer = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { name: true, email: true },
        });
        const store = await prisma.store.findUnique({
          where: { id: storeId },
          select: { name: true },
        });
        if (buyer && store) {
          await inngest.send({
            name: "app/order.shipped",
            data: {
              orderId,
              userEmail: buyer.email,
              userName: buyer.name,
              storeName: store.name,
            },
          });
        }
      } catch (notifError) {
        console.error("Shipping notification error (non-fatal):", notifError);
      }
    }

    return NextResponse.json({ message: "Order status updated successfully!", updatedOrder });
  } catch (error) {
    console.error("Status Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
