import prisma from "@/src/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    let products = await prisma.product.findMany({
      where: {
        inStock: true,
        // Only show products that are published (scheduledAt is null or in the past)
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } },
        ],
      },

      include: {
        store: {
          select: {
            isActive: true,
            name: true,
            logo: true,
            username: true,
            userId: true,
          },
        },
        variantGroups: {
          include: { options: { orderBy: { position: "asc" } } },
          orderBy: { position: "asc" },
        },
        rating: {
          select: {
            id: true,
            createdAt: true,
            rating: true,
            review: true,
            reviewImages: true,
            sellerResponse: true,
            userId: true,
            user: {
              select: { name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    products = products.filter((product) => product.store?.isActive);

    return NextResponse.json({
      products,
    });
  } catch (error) {
    //console.log(error);

    return NextResponse.json(
      { error: "Failed to fetch products" },

      { status: 500 },
    );
  }
}
