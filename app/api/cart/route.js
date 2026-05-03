import prisma from "@/src/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// update user cart API route handler
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { cart } = await request.json();

        // Basic cart validation — prevent oversized payloads
        if (!Array.isArray(cart)) {
            return NextResponse.json({ error: "Invalid cart format" }, { status: 400 });
        }
        if (cart.length > 100) {
            return NextResponse.json({ error: "Cart cannot exceed 100 items" }, { status: 400 });
        }

        // Validate each item
        for (const item of cart) {
            if (typeof item !== 'object' || !item.productId || typeof item.quantity !== 'number' || item.quantity < 0) {
                return NextResponse.json({ error: "Invalid cart item format" }, { status: 400 });
            }
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
    try {
        const { userId } = getAuth(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { cart: true }
        });
        const cartData = user?.cart ?? [];
        // Ensure it's an array
        const cart = Array.isArray(cartData) ? cartData : [];
        return NextResponse.json({ cart });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
