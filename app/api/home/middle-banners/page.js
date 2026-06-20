import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
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

    return res.status(200).json({ banners });
  } catch (error) {
    console.error("GET /api/home/middle-banners error:", error);
    return res.status(500).json({ message: "Failed to load middle banners" });
  }
}
