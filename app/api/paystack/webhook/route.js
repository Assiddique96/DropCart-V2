import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/src/db";

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  // Verify HMAC-SHA512 signature using your exact env label
  const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SK;
  
  const hash = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    console.error("Paystack webhook: invalid signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    const userId = event.data?.metadata?.userId;
    
    // Safely parse regardless of whether frontend sent an array or string
    const rawOrderIds = event.data?.metadata?.orderIds;
    const orderIds = Array.isArray(rawOrderIds)
      ? rawOrderIds
      : (typeof rawOrderIds === "string" && rawOrderIds.trim() !== "" ? rawOrderIds.split(",") : []);

    console.log("Processing incoming Paystack success event:", { reference, orderIds, userId });

    if (orderIds.length > 0 && userId) {
      try {
        const updateResult = await prisma.order.updateMany({
          where: { 
            id: { in: orderIds }, 
            userId: userId 
          },
          data: { isPaid: true },
        });
        console.log(`Successfully marked ${updateResult.count} orders as paid.`);
      } catch (dbError) {
        console.error("Database mutation failure inside Paystack webhook:", dbError);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
    } else {
      console.warn("Paystack Webhook received valid charge but payload metadata was missing orderIds or userId.");
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}