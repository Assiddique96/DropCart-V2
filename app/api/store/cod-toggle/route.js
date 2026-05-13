import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/src/db";

// toggle COD acceptance of a product
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "missing details: productId" },
        {
          status: 400,
        },
      );

    }

    const storeId = await authSeller(userId, request.headers.get("x-store-id"));
    if (!storeId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    // check if product exists
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      return NextResponse.json({ error: "no product found" }, { status: 404 });
    }

    // Only allow COD toggle for LOCAL products
    if (product.origin !== 'LOCAL') {
      return NextResponse.json({ error: "COD toggle only available for local products" }, { status: 400 });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { acceptCod: !product.acceptCod },
    });
    return NextResponse.json({
      message: "Product COD setting updated successfully!",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 },
    );
  }
}