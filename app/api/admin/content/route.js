import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import {
  SITE_CATEGORIES_CONFIG_KEY,
  SITE_FAQ_CONFIG_KEY,
  SITE_PRIVACY_CONFIG_KEY,
  SITE_TERMS_CONFIG_KEY,
  SITE_COOKIES_CONFIG_KEY,
  parseStoredCategories,
  parseStoredFaq,
  parseStoredText,
  normalizeAdminContentBody,
} from "@/lib/siteConfig";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.platformConfig.findMany({
      where: {
        key: {
          in: [
            SITE_CATEGORIES_CONFIG_KEY,
            SITE_FAQ_CONFIG_KEY,
            SITE_PRIVACY_CONFIG_KEY,
            SITE_TERMS_CONFIG_KEY,
            SITE_COOKIES_CONFIG_KEY,
          ],
        },
      },
    });

    const config = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    return NextResponse.json({
      categories: parseStoredCategories(config[SITE_CATEGORIES_CONFIG_KEY] ?? ""),
      faqItems: parseStoredFaq(config[SITE_FAQ_CONFIG_KEY] ?? ""),
      privacyPolicy: parseStoredText(config[SITE_PRIVACY_CONFIG_KEY] ?? ""),
      termsOfUse: parseStoredText(config[SITE_TERMS_CONFIG_KEY] ?? ""),
      cookiesPolicy: parseStoredText(config[SITE_COOKIES_CONFIG_KEY] ?? ""),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const normalized = normalizeAdminContentBody(body);
    if (normalized.error) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const updates = [];
    if (normalized.categoriesJson !== undefined) {
      updates.push(
        prisma.platformConfig.upsert({
          where: { key: SITE_CATEGORIES_CONFIG_KEY },
          update: { value: normalized.categoriesJson },
          create: { key: SITE_CATEGORIES_CONFIG_KEY, value: normalized.categoriesJson },
        })
      );
    }
    if (normalized.faqJson !== undefined) {
      updates.push(
        prisma.platformConfig.upsert({
          where: { key: SITE_FAQ_CONFIG_KEY },
          update: { value: normalized.faqJson },
          create: { key: SITE_FAQ_CONFIG_KEY, value: normalized.faqJson },
        })
      );
    }
    if (normalized.privacyPolicy !== undefined) {
      updates.push(
        prisma.platformConfig.upsert({
          where: { key: SITE_PRIVACY_CONFIG_KEY },
          update: { value: normalized.privacyPolicy },
          create: { key: SITE_PRIVACY_CONFIG_KEY, value: normalized.privacyPolicy },
        })
      );
    }
    if (normalized.termsOfUse !== undefined) {
      updates.push(
        prisma.platformConfig.upsert({
          where: { key: SITE_TERMS_CONFIG_KEY },
          update: { value: normalized.termsOfUse },
          create: { key: SITE_TERMS_CONFIG_KEY, value: normalized.termsOfUse },
        })
      );
    }
    if (normalized.cookiesPolicy !== undefined) {
      updates.push(
        prisma.platformConfig.upsert({
          where: { key: SITE_COOKIES_CONFIG_KEY },
          update: { value: normalized.cookiesPolicy },
          create: { key: SITE_COOKIES_CONFIG_KEY, value: normalized.cookiesPolicy },
        })
      );
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No content fields provided." }, { status: 400 });
    }

    await Promise.all(updates);
    return NextResponse.json({ message: "Content updated successfully." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
