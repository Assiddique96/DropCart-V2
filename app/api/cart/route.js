import prisma from "@/src/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { defaultLimiter, looseLimiter } from "@/lib/rateLimit";

// update user cart API route handler
export async function POST(request) {
    const limit = defaultLimiter.check(request);
    if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    try {
        const { userId } = getAuth(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { cart } = await request.json();

        // Basic cart validation — prevent oversized payloads
        if (typeof cart !== 'object' || Array.isArray(cart)) {
            return NextResponse.json({ error: "Invalid cart format" }, { status: 400 });
        }
        if (Object.keys(cart).length > 100) {
            return NextResponse.json({ error: "Cart cannot exceed 100 items" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { cart }
        });
        return NextResponse.json({ message: "Cart updated successfully" });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// get user cart API route handler
export async function GET(request) {
    const limit = looseLimiter.check(request);
    if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    try {
        const { userId } = getAuth(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { cart: true }
        });
        return NextResponse.json({ cart: user?.cart ?? {} });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
