import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [orders, products, stores, users, allOrders, cancelledCount, paidOrders] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.store.count({ where: { status: "approved" } }),
      prisma.user.count(),
      prisma.order.findMany({
        select: { createdAt: true, total: true, isPaid: true, status: true, paymentMethod: true },
      }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
      prisma.order.findMany({
        where: { isPaid: true },
        select: { total: true },
      }),
    ]);

    const totalRevenue = allOrders.reduce((s, o) => s + o.total, 0);
    const paidRevenue = paidOrders.reduce((s, o) => s + o.total, 0);
    const unpaidRevenue = totalRevenue - paidRevenue;

    return NextResponse.json({
      orders,
      products,
      stores,
      users,
      cancelledOrders: cancelledCount,
      revenue: totalRevenue.toFixed(2),
      paidRevenue: paidRevenue.toFixed(2),
      unpaidRevenue: unpaidRevenue.toFixed(2),
      allOrders,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}
