import { NextResponse } from "next/server";
import prisma from "src/db";
import { looseLimiter } from "@/lib/rateLimit";
import {
  HOME_PAGE_CONFIG_KEY,
  parseStoredHomePageContent,
} from "@/lib/homePageContent";

const limiter = looseLimiter;

/** GET /api/home/content — public home hero slide configuration */
export async function GET(request) {
  const limited = limiter.check(request);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const row = await prisma.platformConfig.findUnique({
      where: { key: HOME_PAGE_CONFIG_KEY },
    });
    const parsed = parseStoredHomePageContent(row?.value ?? "");
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ featured: [], promo1: [], promo2: [] });
  }
}
