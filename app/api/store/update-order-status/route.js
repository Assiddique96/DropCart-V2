import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import authSeller from "@/middlewares/authSeller";
import { inngest } from "@/inngest/client";

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

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data,
    });

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
