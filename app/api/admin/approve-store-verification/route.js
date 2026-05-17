import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";

/**
 * POST /api/admin/approve-store-verification — Approve a store's verification
 */

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storeId } = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        verificationStatus: "verified",
        verificationRejectedReason: null,
      },
    });

    return NextResponse.json({
      message: "Store verification approved",
      store: updatedStore,
    });
  } catch (error) {
    console.error("Approve store verification error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
