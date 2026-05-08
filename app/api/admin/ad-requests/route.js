import prisma from "@/src/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { auditLog } from "@/lib/auditLog";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Check if user is admin

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Check if user is admin

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
    const updatedRequest = await prisma.adRequest.update({
      where: { id },
      data: {
        status,
        adminNote,
        approvedAt: status === "APPROVED" ? new Date() : null,
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
    }

    // Audit log
    await auditLog({
      adminId: userId,
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