import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { sanitizeString } from "@/lib/sanitize";

/**
 * POST /api/admin/reject-store-verification — Reject a store's verification
 */

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storeId, reason } = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
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
        verificationStatus: "rejected",
        verificationRejectedReason: sanitizeString(reason, 500),
      },
    });

    return NextResponse.json({
      message: "Store verification rejected",
      store: updatedStore,
    });
  } catch (error) {
    console.error("Reject store verification error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
