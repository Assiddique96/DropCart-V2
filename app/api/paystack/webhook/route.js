import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/src/db";

/**
 * POST /api/paystack/webhook
 * Paystack sends events here. We verify the HMAC signature and mark orders paid.
 * Set the webhook URL in your Paystack dashboard → Settings → API Keys & Webhooks.
 */
export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  // Verify HMAC-SHA512 signature
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    console.error("Paystack webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    const orderIds  = event.data?.metadata?.orderIds?.split(",") ?? [];
    const userId    = event.data?.metadata?.userId;

    if (orderIds.length > 0 && userId) {
      await prisma.order.updateMany({
        where: { id: { in: orderIds }, userId },
        data: { isPaid: true },
      });
    }
  }

  return NextResponse.json({ received: true });
}
