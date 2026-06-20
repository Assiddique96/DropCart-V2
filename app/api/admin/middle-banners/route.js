import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const banners = await prisma.middleBanner.findMany({
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("GET /api/admin/middle-banners error:", error);
    return NextResponse.json(
      { message: "Failed to load banners" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
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
      return NextResponse.json(
        { message: "Title and imageUrl are required" },
        { status: 400 }
      );
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
    return NextResponse.json(
      { message: "Failed to create banner" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
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
      return NextResponse.json(
        { message: "id is required" },
        { status: 400 }
      );
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
    return NextResponse.json(
      { message: "Failed to update banner" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: "id is required" },
        { status: 400 }
      );
    }

    await prisma.middleBanner.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Banner deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/middle-banners error:", error);
    return NextResponse.json(
      { message: "Failed to delete banner" },
      { status: 500 }
    );
  }
}
