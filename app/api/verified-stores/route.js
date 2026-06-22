import { NextResponse } from "next/server";
import prisma from "src/db";

/** GET /api/verified-stores – returns stores with verificationStatus=verified for hero display */
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      where: {
        verificationStatus: "verified",
        isActive: true,
        status: "approved",
      },
      select: {
        id: true,
        name: true,
        username: true,
        logo: true,
        city: true,
        state: true,
        storeRatings: { select: { rating: true } },
        _count: { select: { Order: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    });

    const result = stores.map((s) => {
      const ratings = s.storeRatings ?? [];
      const avg =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : null;

      const locationParts = [s.city, s.state].filter(Boolean);
      const tag = locationParts.length ? locationParts.join(", ") : "Verified Store";

      const ordersCount = s._count.Order;
      const ordersDisplay =
        ordersCount >= 1000 ? `${(ordersCount / 1000).toFixed(1)}k+` : `${ordersCount}+`;

      return {
        id: s.id,
        name: s.name,
        rating: avg !== null ? parseFloat(avg.toFixed(1)) : null,
        orders: ordersDisplay,
        tag,
        href: `/shop/${s.username}`,
        logo: s.logo || null,
      };
    });

    return NextResponse.json({ stores: result });
  } catch (err) {
    console.error("[verified-stores]", err);
    return NextResponse.json({ stores: [] }, { status: 500 });
  }
}
