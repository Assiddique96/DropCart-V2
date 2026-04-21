import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authSeller from "@/middlewares/authSeller";
import { defaultLimiter, looseLimiter } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/sanitize";
import { inngest } from "@/inngest/client";

/**
 * Seller-scoped coupons. These are tied to a specific store (storeId is set).
 * Buyers can only use them when ordering from that store.
 *
 * GET    /api/store/coupons           — list store's coupons
 * POST   /api/store/coupons           — create a store coupon
 * DELETE /api/store/coupons?code=xxx  — delete a store coupon
 */

export async function GET(request) {
    const limit = looseLimiter.check(request);
    if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId, request.headers.get("x-store-id"));
        if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const coupons = await prisma.coupon.findMany({
            where: { storeId },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ coupons });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const limit = defaultLimiter.check(request);
    if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId, request.headers.get("x-store-id"));
        if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { coupon } = await request.json();

        // Validate
        const code = sanitizeString(coupon.code, 50).toUpperCase();
        if (!code) return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });

        const discount = parseFloat(coupon.discount);
        if (isNaN(discount) || discount <= 0) {
            return NextResponse.json({ error: "Discount must be a positive number." }, { status: 400 });
        }
        if (coupon.discountType === "PERCENTAGE" && discount > 100) {
            return NextResponse.json({ error: "Percentage discount cannot exceed 100." }, { status: 400 });
        }

        const created = await prisma.coupon.create({
            data: {
                code,
                storeId,
                description: sanitizeString(coupon.description || "", 500),
                discountType: coupon.discountType === "FIXED" ? "FIXED" : "PERCENTAGE",
                discount,
                forNewUser:    Boolean(coupon.forNewUser),
                forMember:     Boolean(coupon.forMember),
                isPublic:      Boolean(coupon.isPublic),
                expiresAt:     new Date(coupon.expiresAt),
                maxUses:       coupon.maxUses ? parseInt(coupon.maxUses) : null,
                minOrderValue: coupon.minOrderValue ? parseFloat(coupon.minOrderValue) : null,
            },
        });

        // Schedule deletion on expiry
        await inngest.send({
            name: "app/coupon.expired",
            data: { code: created.code, expires_at: created.expiresAt },
        });

        return NextResponse.json({ message: "Coupon created successfully.", coupon: created });
    } catch (error) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const limit = defaultLimiter.check(request);
    if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId, request.headers.get("x-store-id"));
        if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

        // Verify the coupon belongs to this store
        const coupon = await prisma.coupon.findFirst({ where: { code, storeId } });
        if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });

        await prisma.coupon.delete({ where: { code } });
        return NextResponse.json({ message: "Coupon deleted." });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
