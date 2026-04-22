import { NextResponse } from "next/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";

// API to display all stores and grouped counts for admin dashboard.

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stores = await prisma.store.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    const counts = stores.reduce(
      (acc, store) => {
        if (store.status === "approved") acc.approved += 1;
        else if (store.status === "pending") acc.pending += 1;
        else if (store.status === "rejected") acc.rejected += 1;
        return acc;
      },
      { approved: 0, pending: 0, rejected: 0 }
    );
    return NextResponse.json({
      stores,
      counts: {
        ...counts,
        total: counts.approved + counts.pending + counts.rejected,
      },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 },
    );
  }
}

