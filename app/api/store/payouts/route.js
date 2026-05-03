import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import authSeller from "@/middlewares/authSeller";

// GET /api/store/payouts — seller views their payout history + pending balance
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId, request.headers.get("x-store-id"));
    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delivered revenue: paid online, or COD (collected at delivery)
    const deliveredOrders = await prisma.order.findMany({
      where: {
        storeId,
        status: "DELIVERED",
        OR: [{ isPaid: true }, { paymentMethod: "COD" }],
      },
      select: { total: true },
    });

    const totalDeliveredRevenue = deliveredOrders.reduce((acc, o) => acc + o.total, 0);

    // All payouts for this store
    const payouts = await prisma.payout.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    });

    const totalPaidOut = payouts
      .filter((p) => p.status === "PAID")
      .reduce((acc, p) => acc + p.amount, 0);

    const pendingBalance = parseFloat((totalDeliveredRevenue - totalPaidOut).toFixed(2));

    return NextResponse.json({
      payouts,
      totalDeliveredRevenue: parseFloat(totalDeliveredRevenue.toFixed(2)),
      totalPaidOut: parseFloat(totalPaidOut.toFixed(2)),
      pendingBalance,
    });
  } catch (error) {
    console.error("Payout fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
