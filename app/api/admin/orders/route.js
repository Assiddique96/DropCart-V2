import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { isOrderConsideredPaid } from "@/lib/orderPayment";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const take = Math.min(parseInt(searchParams.get("take") || "25", 10) || 25, 100);
    const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10) || 0, 0);
    const status = searchParams.get("status") || null;
    const paid = searchParams.get("paid"); // "true" | "false" | null
    const q = (searchParams.get("q") || "").trim();

    const where = {
      ...(status ? { status } : {}),
      ...(paid === "true" ? { isPaid: true } : paid === "false" ? { isPaid: false } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { store: { name: { contains: q, mode: "insensitive" } } },
              { user: { name: { contains: q, mode: "insensitive" } } },
              { user: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          createdAt: true,
          total: true,
          status: true,
          paymentMethod: true,
          isPaid: true,
          user: { select: { id: true, name: true, email: true } },
          store: { select: { id: true, name: true, username: true } },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      take,
      skip,
      orders: orders.map((o) => ({ ...o, isPaid: isOrderConsideredPaid(o) })),
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

