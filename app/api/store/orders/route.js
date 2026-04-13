import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authSeller from "@/middlewares/authSeller";

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
            include: { user: true, address: true, orderItems: { include: { product: true } } },
            orderBy: { createdAt: "desc" }
        })
        return NextResponse.json({orders})
    } catch (error) {
        console.log(error)
        return NextResponse.json({error: "Failed to fetch orders"}, {status: 500})
    }
}