import { NextResponse } from "next/server";
import prisma from "@/src/db";


// GET /api/config — public shipping + tax configuration (used by checkout and cart)
export async function GET(request) {
  try {
    const rows = await prisma.platformConfig.findMany({
      where: { key: { in: ["shipping_base_fee", "shipping_abroad_fee", "shipping_free_above", "tax_rate"] } },
    });
    const config = Object.fromEntries(rows.map((r) => [r.key, parseFloat(r.value)]));
    return NextResponse.json({
      shipping_base_fee:    config.shipping_base_fee    ?? 7000,
      shipping_abroad_fee:  config.shipping_abroad_fee  ?? 15000,
      shipping_free_above:  config.shipping_free_above  ?? 0,
      tax_rate:             config.tax_rate             ?? 0,
    });
  } catch {
    return NextResponse.json({
      shipping_base_fee:   7000,
      shipping_abroad_fee: 15000,
      shipping_free_above: 0,
      tax_rate:            0,
    });
  }
}
