import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";

// Toggle store status (Active/Close) by admin

export async function POST(request) {
    try {
        const {userId} = getAuth(request)
        const isAdmin = await authAdmin(userId)

        if (!isAdmin) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

       const {storeId} = await request.json()

       if (!storeId) {
        return NextResponse.json({error: "Store ID is required"}, {status: 400})
       }

       // find store by id
       const store = await prisma.store.findUnique({where: {id: storeId}})
         if (!store) {
            return NextResponse.json({error: "Store not found"}, {status: 404})
         }
         // toggle store status
         await prisma.store.update({
            where: {id: storeId},
            data: {isActive: !store.isActive}
         })

      return NextResponse.json({message: "Store status updated successfully"})
    } catch (error) {
        console.log(error)
        return NextResponse.json({error: error.code || error.message}, {status: 400})
    }
}