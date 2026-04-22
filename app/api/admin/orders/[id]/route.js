import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { isOrderConsideredPaid } from "@/lib/orderPayment";

export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = params?.id;
    if (!id) return NextResponse.json({ error: "Missing order id" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        store: true,
        address: true,
        refund: true,
        orderItems: { include: { product: true } },
      },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({
      order: {
        ...order,
        isPaid: isOrderConsideredPaid(order),
      },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

