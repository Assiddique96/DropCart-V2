import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { isOrderConsideredPaid } from "@/lib/orderPayment";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [orders, products, approvedStores, pendingStores, rejectedStores, users, allOrders, cancelledCount, recentOrders, recentStores, madeInGroups] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.store.count({ where: { status: "approved" } }),
      prisma.store.count({ where: { status: "pending" } }),
      prisma.store.count({ where: { status: "rejected" } }),
      prisma.user.count(),
      prisma.order.findMany({
        select: { createdAt: true, total: true, isPaid: true, status: true, paymentMethod: true },
      }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          total: true,
          status: true,
          paymentMethod: true,
          isPaid: true,
          user: { select: { name: true, email: true } },
          store: { select: { name: true } },
        },
      }),
      prisma.store.findMany({
        take: 6,
        where: { status: { in: ["pending", "rejected"] } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.product.groupBy({
        by: ["madeIn"],
        _count: { _all: true },
      }),
    ]);

    const totalRevenue = allOrders.reduce((s, o) => s + o.total, 0);
    const paidRevenue = allOrders
      .filter((o) => isOrderConsideredPaid(o))
      .reduce((s, o) => s + o.total, 0);
    const unpaidRevenue = totalRevenue - paidRevenue;

    return NextResponse.json({
      orders,
      products,
      stores: approvedStores,
      approvedStores,
      pendingStores,
      rejectedStores,
      totalStores: approvedStores + pendingStores + rejectedStores,
      users,
      cancelledOrders: cancelledCount,
      revenue: totalRevenue.toFixed(2),
      paidRevenue: paidRevenue.toFixed(2),
      unpaidRevenue: unpaidRevenue.toFixed(2),
      allOrders,
      recentOrders: recentOrders.map((o) => ({
        ...o,
        isPaid: isOrderConsideredPaid(o),
      })),
      recentStores,
      madeInBreakdown: madeInGroups
        .map((g) => ({
          madeIn: (g.madeIn || "Unknown").trim?.() ? g.madeIn.trim() : (g.madeIn || "Unknown"),
          count: g._count?._all || 0,
        }))
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count),
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}
