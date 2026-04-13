import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { defaultLimiter } from "@/lib/rateLimit";

// GET /api/admin/payouts — list all payouts across all stores
export async function GET(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payouts = await prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
      include: { store: { select: { name: true, email: true, username: true } } },
    });

    return NextResponse.json({ payouts });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/payouts — create a payout record for a store
export async function POST(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storeId, amount, note } = await request.json();
    if (!storeId || !amount || amount <= 0) {
      return NextResponse.json({ error: "storeId and a positive amount are required." }, { status: 400 });
    }

    const payout = await prisma.payout.create({
      data: {
        storeId,
        amount: parseFloat(amount),
        status: "PAID",
        note: note || null,
      },
    });

    return NextResponse.json({ message: "Payout recorded successfully.", payout });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/payouts — update payout status
export async function PATCH(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payoutId, status } = await request.json();
    if (!payoutId || !["PENDING", "PAID"].includes(status)) {
      return NextResponse.json({ error: "payoutId and valid status required." }, { status: 400 });
    }

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: { status },
    });

    return NextResponse.json({ message: "Payout updated.", payout: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
