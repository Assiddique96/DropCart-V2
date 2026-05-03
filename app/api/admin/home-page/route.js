import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { writeAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog";
import {
  HOME_PAGE_CONFIG_KEY,
  normalizeHomePagePutBody,
  parseStoredHomePageContent,
} from "@/lib/homePageContent";

/** GET /api/admin/home-page — load saved JSON (may be empty arrays) */
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const row = await prisma.platformConfig.findUnique({
      where: { key: HOME_PAGE_CONFIG_KEY },
    });
    const parsed = parseStoredHomePageContent(row?.value ?? "");
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** PUT /api/admin/home-page — replace home hero slides */
export async function PUT(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const result = normalizeHomePagePutBody(body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await prisma.platformConfig.upsert({
      where: { key: HOME_PAGE_CONFIG_KEY },
      update: { value: result.json },
      create: { key: HOME_PAGE_CONFIG_KEY, value: result.json },
    });

    const client = await clerkClient();
    const adminUser = await client.users.getUser(userId).catch(() => null);
    await writeAuditLog({
      adminId: userId,
      adminEmail: adminUser?.emailAddresses?.[0]?.emailAddress || "unknown",
      action: AUDIT_ACTIONS.UPDATE_HOME_PAGE,
      targetType: "PlatformConfig",
      targetId: HOME_PAGE_CONFIG_KEY,
      details: {
        featuredCount: result.payload.featured.length,
        promo1Count: result.payload.promo1.length,
        promo2Count: result.payload.promo2.length,
      },
    });

    return NextResponse.json({ message: "Home page content saved.", ...result.payload });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
