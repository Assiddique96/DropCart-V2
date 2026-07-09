import prisma from "@/src/db";
import { NextResponse } from "next/server";

// GET /api/ads/config — public, read-only ad pricing so sellers can see the
// cost before requesting a featured slot. (Full platform config stays
// admin-only via /api/admin/config.)
export async function GET() {
  try {
    const rows = await prisma.platformConfig.findMany({
      where: { key: { in: ["ad_price_per_day", "ad_min_duration_days", "ad_max_duration_days"] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, parseFloat(r.value)]));

    return NextResponse.json({
      pricePerDay: map.ad_price_per_day ?? 500,
      minDurationDays: map.ad_min_duration_days ?? 3,
      maxDurationDays: map.ad_max_duration_days ?? 30,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
