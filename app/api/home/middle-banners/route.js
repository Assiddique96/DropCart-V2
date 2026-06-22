import { NextResponse } from "next/server";
import prisma from "src/db"; // Reusing your main prisma instance from file 1

/** GET /api/home/middle-banners */
export async function GET() {
  try {
    const now = new Date();

    // Fetches active banners where the current date falls within their schedule
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
    return NextResponse.json(
      { message: "Failed to load middle banners" },
      { status: 500 }
    );
  }
}