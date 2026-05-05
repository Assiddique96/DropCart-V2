import { NextResponse } from "next/server";
import prisma from "src/db";
import { SITE_CATEGORIES_CONFIG_KEY, parseStoredCategories } from "@/lib/siteConfig";

export async function GET() {
  try {
    const row = await prisma.platformConfig.findUnique({
      where: { key: SITE_CATEGORIES_CONFIG_KEY },
    });
    const categories = parseStoredCategories(row?.value ?? "");
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
