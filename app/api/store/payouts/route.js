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
      select: { total: true, sellerPayout: true, platformFee: true },
    });

    // sellerPayout (total minus platform commission) is what's actually owed.
    // Orders placed before commission tracking was added default to
    // sellerPayout: 0 — fall back to the full order total for those so we
    // never retroactively deduct a commission sellers weren't charged.
    const payoutFor = (o) => (o.sellerPayout > 0 ? o.sellerPayout : o.total);

    const totalDeliveredRevenue = deliveredOrders.reduce((acc, o) => acc + payoutFor(o), 0);
    const totalGrossRevenue = deliveredOrders.reduce((acc, o) => acc + o.total, 0);
    const totalCommission = deliveredOrders.reduce((acc, o) => acc + (o.platformFee || 0), 0);

    // All payouts for this store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        payoutBankName: true,
        payoutAccountName: true,
        payoutAccountNumber: true,
      },
    });

    const payouts = await prisma.payout.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    });

    const totalPaidOut = payouts
      .filter((p) => p.status === "PAID")
      .reduce((acc, p) => acc + p.amount, 0);

    const totalRequested = payouts
      .filter((p) => p.status === "PENDING")
      .reduce((acc, p) => acc + p.amount, 0);

    const pendingBalance = parseFloat((totalDeliveredRevenue - totalPaidOut).toFixed(2));
    const availableBalance = parseFloat((totalDeliveredRevenue - totalPaidOut - totalRequested).toFixed(2));

    return NextResponse.json({
      payouts,
      store,
      totalDeliveredRevenue: parseFloat(totalDeliveredRevenue.toFixed(2)), // net of commission — what you're owed
      totalGrossRevenue: parseFloat(totalGrossRevenue.toFixed(2)),         // before commission
      totalCommission: parseFloat(totalCommission.toFixed(2)),            // platform's cut
      totalPaidOut: parseFloat(totalPaidOut.toFixed(2)),
      totalRequested: parseFloat(totalRequested.toFixed(2)),
      availableBalance,
      pendingBalance,
    });
  } catch (error) {
    console.error("Payout fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId, request.headers.get("x-store-id"));
    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body.amount);
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Please enter a valid payout amount." }, { status: 400 });
    }

    const deliveredOrders = await prisma.order.findMany({
      where: {
        storeId,
        status: "DELIVERED",
        OR: [{ isPaid: true }, { paymentMethod: "COD" }],
      },
      select: { total: true, sellerPayout: true },
    });

    const payoutFor = (o) => (o.sellerPayout > 0 ? o.sellerPayout : o.total);
    const totalDeliveredRevenue = deliveredOrders.reduce((acc, o) => acc + payoutFor(o), 0);
    const payouts = await prisma.payout.findMany({ where: { storeId } });

    const totalPaidOut = payouts
      .filter((p) => p.status === "PAID")
      .reduce((acc, p) => acc + p.amount, 0);
    const totalRequested = payouts
      .filter((p) => p.status === "PENDING")
      .reduce((acc, p) => acc + p.amount, 0);
    const availableBalance = parseFloat((totalDeliveredRevenue - totalPaidOut - totalRequested).toFixed(2));

    if (availableBalance <= 0) {
      return NextResponse.json({ error: "There is no available balance to request at this time." }, { status: 400 });
    }
    if (amount > availableBalance) {
      return NextResponse.json({ error: "Requested amount exceeds the available payout balance." }, { status: 400 });
    }

    const payout = await prisma.payout.create({
      data: {
        storeId,
        amount: parseFloat(amount.toFixed(2)),
        status: "PENDING",
        note: note || "Seller payout request",
      },
    });

    return NextResponse.json({
      payout,
      totalRequested: parseFloat((totalRequested + payout.amount).toFixed(2)),
      availableBalance: parseFloat((availableBalance - payout.amount).toFixed(2)),
      pendingBalance: parseFloat((totalDeliveredRevenue - totalPaidOut).toFixed(2)),
    });
  } catch (error) {
    console.error("Payout request error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
