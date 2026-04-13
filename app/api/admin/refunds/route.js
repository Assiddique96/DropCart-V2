import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { defaultLimiter, looseLimiter } from "@/lib/rateLimit";
import { sanitizeString, sanitizeNumber } from "@/lib/sanitize";

/**
 * GET /api/admin/refunds — list all refund requests
 * PATCH /api/admin/refunds — approve or reject a refund
 */

export async function GET(request) {
  const limit = looseLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // optional filter

    const refunds = await prisma.refund.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            total: true,
            paymentMethod: true,
            isPaid: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
            store: { select: { name: true } },
            orderItems: {
              include: { product: { select: { name: true, images: true } } },
            },
          },
        },
      },
    });

    return NextResponse.json({ refunds });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { refundId, action, adminNote: rawNote, amount: rawAmount } = await request.json();

    if (!refundId || !["approve", "reject", "mark_refunded"].includes(action)) {
      return NextResponse.json(
        { error: "refundId and action (approve|reject|mark_refunded) are required." },
        { status: 400 }
      );
    }

    const adminNote = sanitizeString(rawNote || "", 500);
    const amount = rawAmount !== undefined ? sanitizeNumber(rawAmount) : undefined;

    const statusMap = { approve: "APPROVED", reject: "REJECTED", mark_refunded: "REFUNDED" };

    const updated = await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: statusMap[action],
        adminNote: adminNote || null,
        ...(amount !== undefined && !isNaN(amount) ? { amount } : {}),
      },
    });

    // If marking as refunded, also update the order status back to reflect refund
    if (action === "mark_refunded") {
      await prisma.order.update({
        where: { id: updated.orderId },
        data: { status: "CANCELLED" }, // treat fully refunded orders as cancelled
      });
    }

    return NextResponse.json({ message: `Refund ${statusMap[action].toLowerCase()}.`, refund: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
