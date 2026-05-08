import prisma from "@/src/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productId = params.id;

    // Check if product exists and belongs to user's store
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.store.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if ad request already exists
    const existingRequest = await prisma.adRequest.findFirst({
      where: {
        productId,
        storeId: product.storeId,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Ad request already exists for this product" },
        { status: 400 }
      );
    }

    // Create ad request
    const adRequest = await prisma.adRequest.create({
      data: {
        productId,
        storeId: product.storeId,
      },
    });

    return NextResponse.json({ adRequest });
  } catch (error) {
    console.error("Error creating ad request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}