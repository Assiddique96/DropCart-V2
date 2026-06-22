import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";

// GET /api/admin/payouts — list all payouts across all stores
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payouts = await prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            payoutBankName: true,
            payoutAccountName: true,
            payoutAccountNumber: true,
          },
        },
      },
    });

    return NextResponse.json({ payouts });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/payouts — create a manual payout record (marks as PAID immediately)
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { storeId, amount, note } = await request.json();
    if (!storeId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "storeId and a positive amount are required." }, { status: 400 });
    }

    const payout = await prisma.payout.create({
      data: {
        storeId,
        amount: parseFloat(Number(amount).toFixed(2)),
        status: "PAID",
        note: note?.trim() || null,
      },
      include: { store: { select: { id: true, name: true, username: true } } },
    });

    return NextResponse.json({ payout });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/payouts — approve a PENDING seller payout request → mark as PAID
export async function PATCH(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payoutId, status } = await request.json();
    if (!payoutId) return NextResponse.json({ error: "payoutId is required." }, { status: 400 });

    const validStatuses = ["PAID", "PENDING"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const payout = await prisma.payout.update({
      where: { id: payoutId },
      data: { status: status ?? "PAID" },
      include: { store: { select: { id: true, name: true, username: true } } },
    });

    return NextResponse.json({ payout, message: `Payout marked as ${payout.status}.` });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Payout record not found." }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
