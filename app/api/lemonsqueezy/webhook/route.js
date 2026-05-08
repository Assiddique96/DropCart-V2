import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/src/db";

const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

function parseOrderIds(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).flatMap((value) => String(value).split(",")).map((id) => id.trim()).filter(Boolean);
  return String(raw).split(",").map((id) => id.trim()).filter(Boolean);
}

function verifySignature(body, signature) {
  if (!signature || !WEBHOOK_SECRET) return false;
  const normalized = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(normalized, "utf8");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("x-signature") || request.headers.get("X-Signature");

  if (!verifySignature(body, signature)) {
    console.error("Lemon Squeezy webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch (error) {
    console.error("Lemon Squeezy webhook: malformed JSON", error);
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const eventName = event?.meta?.event_name || "";
  const customData = event?.meta?.custom_data || event?.meta?.custom || event?.data?.attributes?.custom || {};
  const orderIds = parseOrderIds(customData?.orderIds ?? customData?.order_ids ?? customData?.orderId ?? customData?.order_id);
  const status = String(event?.data?.attributes?.status || "").toLowerCase();

  if (orderIds.length > 0 && (status === "paid" || eventName === "order_created" && status === "paid")) {
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { isPaid: true },
    });
  }

  return NextResponse.json({ received: true });
}
