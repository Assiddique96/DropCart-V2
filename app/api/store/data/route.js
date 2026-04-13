import prisma from "src/db";
import { NextResponse } from "next/server";


export async function GET(request){
try {
// Get store username from query params
const { searchParams } = new URL(request.url)
const username = searchParams.get('username' ).toLowerCase();

if(!username){
return NextResponse.json({error: "User not found"}, { status: 400 })

}

// Get store info and inStock products with ratings
const store = await prisma.store.findUnique({
where: {username, isActive: true},
include: {Product: {include: {rating: true}}}
})
if(!store){
return NextResponse.json({error: "Store not found"}, { status: 400 })

}
return NextResponse.json({store})

} catch (error) {
    return NextResponse.json(
        { error: error.code || error.message},
        { status: 400 }
        );
}}
