import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import { CURRENCY_CODE } from "@/lib/currency";


const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY;
const FLW_BASE   = "https://api.flutterwave.com/v3";

/**
 * POST /api/flutterwave
 * Initialize a Flutterwave payment link for the given order IDs.
 * Returns { payment_link } — redirect buyer there.
 *
 * GET /api/flutterwave?transaction_id=xxx
 * Verify a Flutterwave transaction and mark orders paid.
 */

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderIds } = await request.json();
    if (!orderIds?.length) return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds }, userId },
    });
    if (!orders.length) return NextResponse.json({ error: "Orders not found" }, { status: 404 });

    const buyer = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    const amount = orders.reduce((sum, o) => sum + o.total, 0);
    const txRef  = `dropcart_${Date.now()}_${userId.slice(-6)}`;
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

    const nameParts = (buyer.name || "Customer").split(" ");

    const res = await fetch(`${FLW_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLW_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency: CURRENCY_CODE,
        redirect_url: `${origin}/orders?payment=success&tx_ref=${txRef}`,
        customer: {
          email: buyer.email,
          name: buyer.name,
          phonenumber: "",
        },
        meta: { orderIds: orderIds.join(","), userId },
        customizations: {
          title: "DropCart",
          description: `Payment for ${orderIds.length} order(s)`,
          logo: `${origin}/favicon.ico`,
        },
      }),
    });

    const data = await res.json();
    if (data.status !== "success") throw new Error(data.message || "Flutterwave initialization failed");

    return NextResponse.json({ payment_link: data.data.link, tx_ref: txRef });
  } catch (error) {
    console.error("Flutterwave init error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transaction_id");
    if (!transactionId) return NextResponse.json({ error: "transaction_id required" }, { status: 400 });

    const res = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${FLW_SECRET}` },
    });
    const data = await res.json();

    if (data.status !== "success" || data.data?.status !== "successful") {
      return NextResponse.json({ paid: false, status: data.data?.status || "unknown" });
    }

    const orderIds = data.data?.meta?.orderIds?.split(",") ?? [];
    const metaUserId = data.data?.meta?.userId;

    if (orderIds.length > 0 && metaUserId === userId) {
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
