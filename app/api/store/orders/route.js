import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authSeller from "@/middlewares/authSeller";
import { isOrderConsideredPaid } from "@/lib/orderPayment";

// get all orders for the seller
export async function GET(request) {
    try {
        const {userId} = getAuth(request)
        const storeId = await authSeller(userId)
        
        if(!storeId) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }
        const orders = await prisma.order.findMany({
            where: {storeId},
            include: { user: true, address: true, refund: true, orderItems: { include: { product: true } } },
            orderBy: { createdAt: "desc" }
        })
        const ordersOut = orders.map((o) => ({
            ...o,
            isPaid: isOrderConsideredPaid(o),
        }))
        return NextResponse.json({ orders: ordersOut })
    } catch (error) {
        console.log(error)
        return NextResponse.json({error: "Failed to fetch orders"}, {status: 500})
    }
}