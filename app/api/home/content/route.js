import { NextResponse } from "next/server";
import prisma from "src/db";
import { looseLimiter } from "@/lib/rateLimit";
import { HOME_PAGE_CONFIG_KEY, parseStoredHomePageContent } from "@/lib/homePageContent";

/** GET /api/home/content — public home hero slide configuration */
export async function GET(request) {
  const limited = looseLimiter.check(request);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const row = await prisma.platformConfig.findUnique({
      where: { key: HOME_PAGE_CONFIG_KEY },
    });

    if (!row?.value) {
      return NextResponse.json(
        { featured: [], promo1: [], promo2: [] },
        { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } }
      );
    }

    const parsed = parseStoredHomePageContent(row.value);
    const safe = {
      featured: Array.isArray(parsed?.featured) ? parsed.featured : [],
      promo1: Array.isArray(parsed?.promo1) ? parsed.promo1 : [],
      promo2: Array.isArray(parsed?.promo2) ? parsed.promo2 : [],
    };

    return NextResponse.json(safe, {
      headers: {
        // Cache home content for 2 min at CDN edge, stale up to 5 min
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[/api/home/content]", err);
    return NextResponse.json(
      { featured: [], promo1: [], promo2: [] },
      { status: 500 }
    );
  }
}
