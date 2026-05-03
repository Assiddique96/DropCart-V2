import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";


/**
 * POST /api/orders/retry-payment
 * Body: { orderId }
 *
 * For unpaid STRIPE/PAYSTACK/FLUTTERWAVE orders, creates a fresh payment session
 * and returns the redirect URL. The caller redirects the user there.
 *
 * COD orders cannot be retried this way — they don't need online payment.
 */
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.userId !== userId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.isPaid) {
      return NextResponse.json({ error: "This order has already been paid." }, { status: 409 });
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot retry payment for a cancelled order." }, { status: 409 });
    }

    if (order.paymentMethod === "COD") {
      return NextResponse.json({ error: "COD orders do not require online payment." }, { status: 400 });
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;
    const orderIds = [orderId];

    // Delegate to the appropriate payment provider
    let redirectUrl;

    if (order.paymentMethod === "STRIPE") {
      const res = await fetch(`${origin}/api/stripe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: request.headers.get("Authorization") || "" },
        body: JSON.stringify({ orderIds }),
      });
      const data = await res.json();
      if (!data.session?.url) throw new Error(data.error || "Failed to create Stripe session");
      redirectUrl = data.session.url;

    } else if (order.paymentMethod === "PAYSTACK") {
      const res = await fetch(`${origin}/api/paystack`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: request.headers.get("Authorization") || "" },
        body: JSON.stringify({ orderIds }),
      });
      const data = await res.json();
      if (!data.authorization_url) throw new Error(data.error || "Failed to create Paystack session");
      redirectUrl = data.authorization_url;

    } else if (order.paymentMethod === "FLUTTERWAVE") {
      const res = await fetch(`${origin}/api/flutterwave`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: request.headers.get("Authorization") || "" },
        body: JSON.stringify({ orderIds }),
      });
      const data = await res.json();
      if (!data.payment_link) throw new Error(data.error || "Failed to create Flutterwave session");
      redirectUrl = data.payment_link;
    }

    return NextResponse.json({ redirectUrl });
  } catch (error) {
    console.error("Payment retry error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
