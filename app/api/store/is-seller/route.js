import authSeller from "@/middlewares/authSeller";
import prisma from "@/src/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Auth Seller
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const requestedStoreId = request.headers.get("x-store-id");
    const isSeller = await authSeller(userId, requestedStoreId);

    if (!isSeller) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const [storeInfo, stores] = await Promise.all([
      prisma.store.findUnique({ where: { id: isSeller } }),
      prisma.store.findMany({
        where: { userId, status: "approved" },
        select: { id: true, name: true, logo: true, username: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return NextResponse.json({ isSeller, storeInfo, stores, activeStoreId: isSeller });
  } catch (error) {
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 },
    );
  }
}
