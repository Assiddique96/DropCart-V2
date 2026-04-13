import { NextResponse } from "next/server";
import prisma from "@/src/db";
import { looseLimiter } from "@/lib/rateLimit";

// GET /api/config — public shipping configuration (used by checkout and cart)
export async function GET(request) {
  const limit = looseLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const rows = await prisma.platformConfig.findMany({
      where: { key: { in: ["shipping_base_fee", "shipping_abroad_fee", "shipping_free_above"] } },
    });
    const config = Object.fromEntries(rows.map((r) => [r.key, parseFloat(r.value)]));
    return NextResponse.json({
      shipping_base_fee:    config.shipping_base_fee    ?? 7000,
      shipping_abroad_fee:  config.shipping_abroad_fee  ?? 15000,
      shipping_free_above:  config.shipping_free_above  ?? 0,
    });
  } catch {
    return NextResponse.json({
      shipping_base_fee:   7000,
      shipping_abroad_fee: 15000,
      shipping_free_above: 0,
    });
  }
}
