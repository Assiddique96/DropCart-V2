// API to manage user addresses
import prisma from "@/src/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// add new address API route handler
export async function POST(request) {
    try {
        const {userId} = getAuth(request);
        const address = await request.json();

        address.userId = userId;

        const newAddress = await prisma.address.create({
            data: {
                ...address,
            userId: userId}
        });
        return NextResponse.json({message: "Address added successfully", address: newAddress})
    } catch (error) {
        //console.error(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400})
    }
}

// get user addresses API route handler
export async function GET(request) {
    try {
        const {userId} = getAuth(request);
        const addresses = await prisma.address.findMany({
            where: {userId}
        });
        return NextResponse.json({addresses});
    } catch (error) {
        return NextResponse.json({error: error.code || error.message}, {status: 400})
        
    }
}