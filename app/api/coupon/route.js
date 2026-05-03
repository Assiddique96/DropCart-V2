import prisma from "@/src/db";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

import { sanitizeString } from "@/lib/sanitize";

// Verify coupon
export async function POST(request) {
    // Rate limit: 30 coupon checks per minute per IP

    try {
        const { userId, has } = getAuth(request);
        const body = await request.json();
        const { code: rawCode, cartTotal } = body;
        const code = sanitizeString(rawCode, 50).toUpperCase();

        if (!code) {
            return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
        }

        const coupon = await prisma.coupon.findUnique({
            where: {
                        code: code,
                        expiresAt: {
                            gt: new Date()
                        }
                    }
        });

        if (!coupon) {
            return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
        }

        // MAX USES CHECK
        if (coupon.maxUses !== null && coupon.usageCount >= coupon.maxUses) {
            return NextResponse.json({ error: 'This coupon has reached its usage limit.' }, { status: 400 });
        }

        // MIN ORDER VALUE CHECK
        if (coupon.minOrderValue && cartTotal !== undefined) {
            if (Number(cartTotal) < coupon.minOrderValue) {
                return NextResponse.json({
                    error: `This coupon requires a minimum order of ${coupon.minOrderValue}.`
                }, { status: 400 });
            }
        }
        // NEW USER CHECK
        if (coupon.forNewUser){
            const userOrders = await prisma.order.findMany({
                where: {
                    userId: userId
                }
            });
            if (userOrders.length > 0) {
                return NextResponse.json({ error: 'Coupon code valid for new users only' }, { status: 400 });
            }
        }
        // NEW MEMBER CHECK
        if (coupon.forMember) {
            const hasPlusPlan = has({plan: `plus`})
            if (!hasPlusPlan) {
                return NextResponse.json({ error: 'Coupon code valid for members only' }, { status: 404 });
            }
        }


        return NextResponse.json({ coupon });
    } catch (error) {
        console.error("Coupon Verification Error:", error);
    return NextResponse.json(
        { error: "Something went wrong while verifying the coupon." }, 
        { status: 500 })
    }
}