import { NextResponse } from "next/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { sanitizeString } from "@/lib/sanitize";

// Adding new coupon route for admin to create coupons

export async function POST(request) {

  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { coupon } = await request.json();
    coupon.code = coupon.code.toUpperCase();

    const createdCoupon = await prisma.coupon.create({
      data: {
        code: coupon.code,
        description: coupon.description || "",
        discountType: coupon.discountType === "FIXED" ? "FIXED" : "PERCENTAGE",
        discount: Number(coupon.discount),
        forNewUser: Boolean(coupon.forNewUser),
        forMember: Boolean(coupon.forMember),
        isPublic: Boolean(coupon.isPublic),
        expiresAt: new Date(coupon.expiresAt),
        maxUses: coupon.maxUses ? parseInt(coupon.maxUses) : null,
        minOrderValue: coupon.minOrderValue ? parseFloat(coupon.minOrderValue) : null,
      },
    }).then(async(coupon) => {
        // Run inngest function to delete expired coupons
        await inngest.send({
          name: "app/coupon.expired",
          data: {
            code: coupon.code,
            expires_at: coupon.expiresAt,
          }
        });
        return coupon
    });

    return NextResponse.json({
      message: "Coupon created successfully",
      coupon: createdCoupon,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 },
    );
  }
}

// delete coupon route for admin to delete coupons

export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    await prisma.coupon.delete({ where: { code } });

    return NextResponse.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 },
    );
  }
}

// get all coupons for admin

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({});

    return NextResponse.json({ coupons });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 },
    );
  }
}
