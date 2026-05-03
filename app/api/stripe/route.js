import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import Stripe from "stripe";
import { CURRENCY_CODE, toSubunit } from "@/lib/currency";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/stripe — create Stripe Checkout session for given order IDs
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderIds } = await request.json();
    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds }, userId },
      include: { orderItems: { include: { product: true } } },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "Orders not found" }, { status: 404 });
    }

    const currency = CURRENCY_CODE.toLowerCase();

    // Build line items from order products
    const lineItems = orders.flatMap((order) =>
      order.orderItems.map((item) => ({
        price_data: {
          currency,
          product_data: {
            name: item.product.name,
            images: item.product.images?.slice(0, 1) ?? [],
          },
          unit_amount: toSubunit(item.price),
        },
        quantity: item.quantity,
      }))
    );

    // Detect shipping fee dynamically: difference between order total and items total
    for (const order of orders) {
      const itemsTotal = order.orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
      const shippingFee = order.total - itemsTotal;
      if (shippingFee > 0.01) {
        lineItems.push({
          price_data: {
            currency,
            product_data: { name: "Shipping Fee" },
            unit_amount: toSubunit(shippingFee),
          },
          quantity: 1,
        });
        break; // shipping is charged once per checkout
      }
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/orders?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?payment=cancelled`,
      metadata: {
        orderIds: orderIds.join(","),
        userId,
      },
      // Pre-fill customer email if available
      customer_email: undefined, // resolved below
    });

    return NextResponse.json({ session: { url: session.url, id: session.id } });
  } catch (error) {
    console.error("Stripe session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment session" },
      { status: 500 }
    );
  }
}

// GET /api/stripe?session_id=xxx — retrieve session status (for payment retry detection)
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return NextResponse.json({ error: "session_id required" }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      status: session.payment_status, // 'paid' | 'unpaid' | 'no_payment_required'
      orderIds: session.metadata?.orderIds?.split(",") ?? [],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
