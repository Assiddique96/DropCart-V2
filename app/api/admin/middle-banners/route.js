import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import authAdmin from "@/middlewares/authAdmin";

// Helper function to verify admin access
async function checkAdmin(request) {
  const { userId } = getAuth(request);
  const isAdmin = await authAdmin(userId);
  return isAdmin;
}

/** GET /api/admin/middle-banners */
export async function GET(request) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prisma?.middleBanner?.findMany) {
      return NextResponse.json({ banners: [] });
    }

    const banners = await prisma.middleBanner.findMany({
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("GET /api/admin/middle-banners error:", error);
    return NextResponse.json({ message: error.message || "Failed to load banners" }, { status: 500 });
  }
}

/** POST /api/admin/middle-banners */
export async function POST(request) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      imageUrl,
      linkUrl,
      ctaText,
      position,
      isActive,
      countryCode,
      startsAt,
      endsAt,
    } = body;

    if (!title || !imageUrl) {
      return NextResponse.json({ message: "Title and imageUrl are required" }, { status: 400 });
    }

    if (!prisma?.middleBanner?.create) {
      return NextResponse.json({ message: "Middle banner storage is not configured" }, { status: 501 });
    }

    const banner = await prisma.middleBanner.create({
      data: {
        title,
        subtitle: subtitle || null,
        imageUrl,
        linkUrl: linkUrl || null,
        ctaText: ctaText || null,
        position: Number(position ?? 0),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        countryCode: countryCode || null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });

    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/middle-banners error:", error);
    return NextResponse.json({ message: error.message || "Failed to create banner" }, { status: 500 });
  }
}

/** PUT /api/admin/middle-banners */
export async function PUT(request) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    
    // Check if the frontend array wrapper exists
    if (!body || !Array.isArray(body.banners)) {
      return NextResponse.json({ message: "banners array is required" }, { status: 400 });
    }

    const updatedBanners = [];

    // Safely parse and upsert every banner in the loop
    for (let i = 0; i < body.banners.length; i++) {
      const b = body.banners[i];
      
      // Map your frontend keys (image, href, cta) to backend keys (imageUrl, linkUrl, ctaText)
      const bannerData = {
        title: String(b.title || "").trim(),
        subtitle: b.subtitle ? String(b.subtitle).trim() : null,
        imageUrl: String(b.image || "").trim(),
        linkUrl: String(b.href || "/shop").trim(),
        ctaText: String(b.cta || "View deals").trim(),
        position: i, // Auto-order based on form position arrangement
        isActive: true,
      };

      if (!bannerData.title || !bannerData.imageUrl) {
        return NextResponse.json({ message: `Banner #${i + 1} requires a Title and Image URL.` }, { status: 400 });
      }

      // Next.js client-side Date.now() IDs are too large for standard DB integer columns. 
      // If it looks like a temporary key, create a fresh record instead.
      const isTempId = !b.id || String(b.id).length > 9;

      if (!prisma?.middleBanner?.create || !prisma?.middleBanner?.upsert) {
        return NextResponse.json({ message: "Middle banner storage is not configured" }, { status: 501 });
      }

      let savedBanner;
      if (isTempId) {
        savedBanner = await prisma.middleBanner.create({
          data: bannerData,
        });
      } else {
        savedBanner = await prisma.middleBanner.upsert({
          where: { id: Number(b.id) },
          update: bannerData,
          create: bannerData,
        });
      }

      updatedBanners.push(savedBanner);
    }

    return NextResponse.json({ message: "Middle banners saved.", banners: updatedBanners });
  } catch (error) {
    console.error("PUT /api/admin/middle-banners error:", error);
    return NextResponse.json({ message: error.message || "Failed to update banners" }, { status: 500 });
  }
}

/** DELETE /api/admin/middle-banners */
export async function DELETE(request) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ message: "id is required" }, { status: 400 });
    }

    if (!prisma?.middleBanner?.delete) {
      return NextResponse.json({ message: "Middle banner storage is not configured" }, { status: 501 });
    }

    await prisma.middleBanner.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Banner deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/middle-banners error:", error);
    return NextResponse.json({ message: error.message || "Failed to delete banner" }, { status: 500 });
  }
}