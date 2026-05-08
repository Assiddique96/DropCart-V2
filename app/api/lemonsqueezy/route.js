import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";

const LEMONSQUEEZY_API_URL = "https://api.lemonsqueezy.com/v1/checkouts";
const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
const LEMONSQUEEZY_VARIANT_ID = process.env.LEMONSQUEEZY_VARIANT_ID;

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!LEMONSQUEEZY_API_KEY || !LEMONSQUEEZY_STORE_ID || !LEMONSQUEEZY_VARIANT_ID) {
      return NextResponse.json({ error: "Lemon Squeezy is not configured" }, { status: 500 });
    }

    const { orderIds } = await request.json();
    if (!orderIds?.length) return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds }, userId },
      include: { orderItems: { include: { product: true } } },
    });
    if (!orders.length) return NextResponse.json({ error: "Orders not found" }, { status: 404 });

    const buyer = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (!buyer?.email) return NextResponse.json({ error: "Buyer email not found" }, { status: 500 });

    const amount = orders.reduce((sum, order) => sum + order.total, 0);
    const customPrice = Math.max(0, Math.round(amount * 100));
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
    const redirectUrl = `${origin}/orders?payment=success&provider=lemonsqueezy`;

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          custom_price: customPrice,
          product_options: {
            name: "DropCart Checkout",
            description: `Payment for ${orderIds.length} order(s) on DropCart`,
            redirect_url: redirectUrl,
          },
          checkout_options: {
            discount: false,
          },
          checkout_data: {
            email: buyer.email,
            name: buyer.name || "Customer",
            custom: {
              orderIds: orderIds.join(","),
              userId,
            },
          },
          preview: true,
        },
        relationships: {
          store: { data: { type: "stores", id: LEMONSQUEEZY_STORE_ID } },
          variant: { data: { type: "variants", id: LEMONSQUEEZY_VARIANT_ID } },
        },
      },
    };

    const res = await fetch(LEMONSQUEEZY_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LEMONSQUEEZY_API_KEY}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data?.data?.attributes?.url) {
      const message = data?.errors?.[0]?.detail || data?.message || "Failed to create Lemon Squeezy checkout";
      throw new Error(message);
    }

    return NextResponse.json({ checkoutUrl: data.data.attributes.url });
  } catch (error) {
    console.error("Lemon Squeezy init error:", error);
    return NextResponse.json({ error: error.message || "Failed to create Lemon Squeezy checkout" }, { status: 500 });
  }
}
