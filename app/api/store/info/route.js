import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import authSeller from "@/middlewares/authSeller";

/**
 * GET /api/store/info — fetch current store info including verification status
 */

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId, request.headers.get("x-store-id"));
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        description: true,
        email: true,
        contact: true,
        address: true,
        logo: true,
        banner: true,
        username: true,
        status: true,
        isActive: true,
        createdAt: true,
        verificationStatus: true,
        verificationRejectedReason: true,
        cacNumber: true,
        verificationDocumentType: true,
        verificationDocumentNumber: true,
        verificationDocumentUrl: true,
        facialVerificationUrl: true,
      },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error("Store info error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
