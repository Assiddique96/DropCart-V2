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

    // If there is no config row yet, return a safe empty shape
    if (!row || !row.value) {
      return NextResponse.json({
        featured: [],
        promo1: [],
        promo2: [],
      });
    }

    const parsed = parseStoredHomePageContent(row.value);

    // Ensure we always return arrays and not undefined/null
    const safe = {
      featured: Array.isArray(parsed?.featured) ? parsed.featured : [],
      promo1: Array.isArray(parsed?.promo1) ? parsed.promo1 : [],
      promo2: Array.isArray(parsed?.promo2) ? parsed.promo2 : [],
    };

    return NextResponse.json(safe);
  } catch (err) {
    // Optional: log the error in dev or to your logging service
    // console.error("Error loading home content:", err);

    return NextResponse.json(
      { featured: [], promo1: [], promo2: [] },
      { status: 500 }
    );
  }
}
