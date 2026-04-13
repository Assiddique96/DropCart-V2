
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { writeAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog";
import { clerkClient } from "@clerk/nextjs/server";

// approve seller store details by admin

export async function POST(request) {
    try {
        const {userId} = getAuth(request)
        const isAdmin = await authAdmin(userId)

        if (!isAdmin) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }
        const {storeId, status} = await request.json()

        if (status === "approved") {
            await prisma.store.update({
                where: {id: storeId},
                data: {status: "approved", isActive: true}
            })
        }else if (status === "rejected") {
            await prisma.store.update({
                where: {id: storeId},
                data: {status: "rejected", isActive: false}
            })
        }

        // Audit log
        const client = await clerkClient();
        const adminUser = await client.users.getUser(userId).catch(() => null);
        await writeAuditLog({
            adminId: userId,
            adminEmail: adminUser?.emailAddresses?.[0]?.emailAddress || "unknown",
            action: status === "approved" ? AUDIT_ACTIONS.APPROVE_STORE : AUDIT_ACTIONS.REJECT_STORE,
            targetType: "Store",
            targetId: storeId,
            details: { status },
        });

        return NextResponse.json({message: status + ' Store status updated successfully'})
    } catch (error) {
        console.log(error)
        return NextResponse.json({error: error.code || error.message}, {status: 400})
    }
}

// get all pending stores for admin to approve or reject
export async function GET(request) {
    try {
        const {userId} = getAuth(request)
        const isAdmin = await authAdmin(userId)

        if (!isAdmin) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        const stores = await prisma.store.findMany({where: {status: {in: ["pending", "rejected"]}}, include: {user: true}})
        return NextResponse.json(stores)
    } catch (error) {
        console.log(error)
        return NextResponse.json({error: error.code || error.message}, {status: 400})
    }
}