import { NextResponse } from "next/server";
import prisma from "@/src/db";

/** GET /api/home/middle-banners */
export async function GET() {
  try {
    if (!prisma?.middleBanner?.findMany) {
      return NextResponse.json({ banners: [] });
    }

    const now = new Date();

    const banners = await prisma.middleBanner.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("GET /api/home/middle-banners error:", error);
    return NextResponse.json({ banners: [] });
  }
}