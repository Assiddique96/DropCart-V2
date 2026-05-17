import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";

/**
 * GET /api/admin/verify-stores — Get all stores pending verification
 */

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        contact: true,
        verificationStatus: true,
        cacNumber: true,
        verificationDocumentType: true,
        verificationDocumentNumber: true,
        verificationDocumentUrl: true,
        facialVerificationUrl: true,
        verificationRejectedReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const counts = {
      total: stores.length,
      pending: stores.filter(s => s.verificationStatus === "pending").length,
      verified: stores.filter(s => s.verificationStatus === "verified").length,
      rejected: stores.filter(s => s.verificationStatus === "rejected").length,
    };

    return NextResponse.json({ stores, counts });
  } catch (error) {
    console.error("Admin verify stores error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
