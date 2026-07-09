import prisma from "@/src/db";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/middlewares/authAdmin";
import { writeAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog";
import { inngest } from "@/inngest/client";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adRequests = await prisma.adRequest.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true,
            store: {
              select: { name: true, username: true },
            },
          },
        },
        store: {
          select: { name: true, username: true },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json({ adRequests });
  } catch (error) {
    console.error("Error fetching ad requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, adminNote } = body;

    if (!id || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const adRequest = await prisma.adRequest.findUnique({
      where: { id },
      include: { product: true, store: true },
    });

    if (!adRequest) {
      return NextResponse.json({ error: "Ad request not found" }, { status: 404 });
    }

    if (adRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 });
    }

    // Update the request
    const now = new Date();
    const startsAt = status === "APPROVED" ? now : null;
    const endsAt = status === "APPROVED"
      ? new Date(now.getTime() + adRequest.durationDays * 24 * 60 * 60 * 1000)
      : null;

    const updatedRequest = await prisma.adRequest.update({
      where: { id },
      data: {
        status,
        adminNote,
        approvedAt: status === "APPROVED" ? now : null,
        startsAt,
        endsAt,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true,
            description: true,
          },
        },
      },
    });

    // If approved, add to featured slides
    if (status === "APPROVED") {
      const homePageContent = await prisma.platformConfig.findUnique({
        where: { key: "home_page_content" },
      });

      let content = { featured: [], promo1: [], promo2: [] };
      if (homePageContent?.value) {
        try {
          content = JSON.parse(homePageContent.value);
        } catch (e) {
          // ignore
        }
      }

      // Add product to featured
      const newSlide = {
        image: updatedRequest.product.images[0] || "",
        badgeLabel: "FEATURED",
        badgeText: "Sponsored",
        title: updatedRequest.product.name,
        line1: updatedRequest.product.description.substring(0, 100) + "...",
        line2: "",
        priceLabel: `₦${updatedRequest.product.price.toLocaleString()}`,
        price: "",
        cta: "Shop Now",
        href: `/product/${updatedRequest.product.id}`,
      };

      content.featured.unshift(newSlide); // Add to beginning

      // Keep only max slides
      if (content.featured.length > 8) {
        content.featured = content.featured.slice(0, 8);
      }

      await prisma.platformConfig.upsert({
        where: { key: "home_page_content" },
        update: { value: JSON.stringify(content) },
        create: { key: "home_page_content", value: JSON.stringify(content) },
      });

      // Schedule automatic removal once the seller's paid duration ends
      await inngest.send({
        name: "app/ad.approved",
        data: {
          adRequestId: updatedRequest.id,
          productId: updatedRequest.product.id,
          endsAt: endsAt.toISOString(),
        },
      });
    }

    // Audit log
    await writeAuditLog({
      adminId: userId,
      adminEmail: "",
      action: status === "APPROVED" ? "APPROVE_AD_REQUEST" : "REJECT_AD_REQUEST",
      targetType: "AdRequest",
      targetId: id,
      details: { status, adminNote },
    });

    return NextResponse.json({ adRequest: updatedRequest });
  } catch (error) {
    console.error("Error updating ad request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}