import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db"; // Reused your project's clean prisma instance import from File 1
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

    const body = await request.json();
    const {
      id,
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

    if (!id) {
      return NextResponse.json({ message: "id is required" }, { status: 400 });
    }

    const banner = await prisma.middleBanner.update({
      where: { id },
      data: {
        title,
        subtitle: subtitle || null,
        imageUrl,
        linkUrl: linkUrl || null,
        ctaText: ctaText || null,
        position: position !== undefined ? Number(position) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        countryCode: countryCode || null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("PUT /api/admin/middle-banners error:", error);
    return NextResponse.json({ message: error.message || "Failed to update banner" }, { status: 500 });
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

    await prisma.middleBanner.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Banner deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/middle-banners error:", error);
    return NextResponse.json({ message: error.message || "Failed to delete banner" }, { status: 500 });
  }
}