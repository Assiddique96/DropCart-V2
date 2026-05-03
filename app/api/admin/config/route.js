import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { defaultLimiter } from "@/lib/rateLimit";

const VALID_KEYS = [
  "commission_rate",
  "shipping_base_fee",        // local product shipping (non-Plus members)
  "shipping_abroad_fee",      // abroad product shipping (non-Plus members)
  "shipping_free_above",      // order total above which local shipping is free
];

// GET /api/admin/config — read all platform config values
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.platformConfig.findMany();
    const config = Object.fromEntries(rows.map((r) => [r.key, parseFloat(r.value)]));

    // Fill in defaults for missing keys
    const defaults = {
      commission_rate: 5,
      shipping_base_fee: 7000,
      shipping_abroad_fee: 15000,
      shipping_free_above: 0,
    };
    return NextResponse.json({ config: { ...defaults, ...config } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/config — upsert one or more config values
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates = [];

    for (const key of VALID_KEYS) {
      if (body[key] !== undefined) {
        const val = parseFloat(body[key]);
        if (isNaN(val) || val < 0) {
          return NextResponse.json({ error: `Invalid value for ${key}` }, { status: 400 });
        }
        updates.push(
          prisma.platformConfig.upsert({
            where: { key },
            update: { value: String(val) },
            create: { key, value: String(val) },
          })
        );
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid keys provided." }, { status: 400 });
    }

    await Promise.all(updates);
    return NextResponse.json({ message: "Configuration updated successfully." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
