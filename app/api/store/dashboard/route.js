import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authSeller from "@/middlewares/authSeller";
import { isOrderConsideredPaid } from "@/lib/orderPayment";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days
    const daysAgo = parseInt(period, 10);
    const since = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const [allOrders, products, ratings, recentOrders] = await Promise.all([
      prisma.order.findMany({ where: { storeId } }),
      prisma.product.findMany({ where: { storeId } }),
      prisma.rating.findMany({
        where: { productId: { in: [] } }, // will be computed below
        include: { product: true, user: true },
      }),
      prisma.order.findMany({
        where: { storeId, createdAt: { gte: since } },
        include: { orderItems: { include: { product: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Re-fetch ratings with correct product ids
    const productIds = products.map(p => p.id);
    const allRatings = await prisma.rating.findMany({
      where: { productId: { in: productIds } },
      include: { product: true, user: true },
    });

    // Revenue breakdown
    const totalEarnings = Math.round(allOrders.reduce((s, o) => s + (o.total || 0), 0));
    const paidEarnings  = Math.round(allOrders.filter(o => isOrderConsideredPaid(o)).reduce((s, o) => s + o.total, 0));

    // Order status breakdown
    const statusBreakdown = allOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    // Recent orders revenue by day (for chart)
    const revenueByDay = {};
    recentOrders.forEach(o => {
      const day = o.createdAt.toISOString().slice(0, 10);
      revenueByDay[day] = (revenueByDay[day] || 0) + o.total;
    });
    const revenueChart = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total: Math.round(total) }));

    // Top products by revenue
    const productRevenue = {};
    allOrders.forEach(o => {
      // sum by store — per-product breakdown needs orderItems
    });

    // Fetch top 5 products by order count
    const orderItemCounts = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { storeId } },
      _sum: { quantity: true },
      _count: { orderId: true },
      orderBy: { _count: { orderId: "desc" } },
      take: 5,
    });

    const topProductIds = orderItemCounts.map(i => i.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, price: true, images: true },
    });

    const topProducts = orderItemCounts.map(item => {
      const details = topProductDetails.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        name: details?.name || "Unknown",
        image: details?.images?.[0] || null,
        price: details?.price || 0,
        orderCount: item._count.orderId,
        totalQty: item._sum.quantity,
      };
    });

    // Avg rating per product
    const avgRating = allRatings.length > 0
      ? (allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length).toFixed(1)
      : null;

    return NextResponse.json({
      // Summary cards
      totalOrders: allOrders.length,
      totalEarnings,
      paidEarnings,
      pendingEarnings: totalEarnings - paidEarnings,
      totalProducts: products.length,
      inStockProducts: products.filter(p => p.inStock).length,
      totalReviews: allRatings.length,
      avgRating,

      // Breakdowns
      statusBreakdown,
      revenueChart,
      topProducts,
      ratings: allRatings,
    });
  } catch (error) {
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}
