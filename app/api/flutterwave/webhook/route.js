import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/src/db";

/**
 * POST /api/flutterwave/webhook
 * Flutterwave sends events here. Verify the secret hash header and mark orders paid.
 * Set the webhook URL in your Flutterwave dashboard → Settings → Webhooks.
 */
export async function POST(request) {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const signature  = request.headers.get("verif-hash");

  if (!signature || signature !== secretHash) {
    console.error("Flutterwave webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = await request.json();

  if (event.event === "charge.completed" && event.data?.status === "successful") {
    const orderIds  = event.data?.meta?.orderIds?.split(",") ?? [];
    const userId    = event.data?.meta?.userId;

    if (orderIds.length > 0 && userId) {
      await prisma.order.updateMany({
        where: { id: { in: orderIds }, userId },
        data: { isPaid: true },
      });
    }
  }

  return NextResponse.json({ received: true });
}
