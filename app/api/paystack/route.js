import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import { toSubunit, CURRENCY_CODE } from "@/lib/currency";
import { strictLimiter } from "@/lib/rateLimit";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE   = "https://api.paystack.co";

/**
 * POST /api/paystack
 * Initialize a Paystack transaction for the given order IDs.
 * Returns { authorization_url, reference } — redirect buyer to authorization_url.
 *
 * GET /api/paystack?reference=xxx
 * Verify a Paystack transaction by reference and mark orders paid.
 */

export async function POST(request) {
  const limit = strictLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderIds } = await request.json();
    if (!orderIds?.length) return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds }, userId },
      include: { orderItems: { include: { product: true } } },
    });
    if (!orders.length) return NextResponse.json({ error: "Orders not found" }, { status: 404 });

    const buyer = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });

    // Total in smallest currency unit (kobo for NGN)
    const amountSubunit = toSubunit(orders.reduce((sum, o) => sum + o.total, 0));

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;
    const reference = `dropcart_${Date.now()}_${userId.slice(-6)}`;

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: buyer.email,
        amount: amountSubunit,
        currency: CURRENCY_CODE,
        reference,
        callback_url: `${origin}/orders?payment=success&reference=${reference}`,
        metadata: {
          orderIds: orderIds.join(","),
          userId,
          custom_fields: [{ display_name: "Customer", variable_name: "customer", value: buyer.name }],
        },
      }),
    });

    const data = await res.json();
    if (!data.status) throw new Error(data.message || "Paystack initialization failed");

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("Paystack init error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");
    if (!reference) return NextResponse.json({ error: "reference required" }, { status: 400 });

    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await res.json();

    if (!data.status || data.data?.status !== "success") {
      return NextResponse.json({ paid: false, status: data.data?.status || "unknown" });
    }

    // Mark orders as paid
    const orderIds = data.data?.metadata?.orderIds?.split(",") ?? [];
    if (orderIds.length > 0) {
      await prisma.order.updateMany({
        where: { id: { in: orderIds }, userId },
        data: { isPaid: true },
      });
    }

    return NextResponse.json({ paid: true, orderIds });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
