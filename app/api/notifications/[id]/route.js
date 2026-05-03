import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import { defaultLimiter } from "@/lib/rateLimit";

export async function PATCH(request, { params }) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notification = await prisma.notification.updateMany({
      where: { id: params.id, userId },
      data: { read: true },
    });

    return NextResponse.json({ success: notification.count > 0 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
