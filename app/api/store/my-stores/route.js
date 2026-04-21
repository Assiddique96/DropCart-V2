import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stores = await prisma.store.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        logo: true,
        status: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
