import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";

function escapeCsvField(v) {
  if (v == null) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}
const row = (fields) => fields.map(escapeCsvField).join(",");

/**
 * GET /api/admin/orders-export
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&status=...&storeId=...
 */
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");
    const storeId = searchParams.get("storeId");

    const where = {
      ...(status ? { status } : {}),
      ...(storeId ? { storeId } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to + "T23:59:59Z") } : {}),
            },
          }
        : {}),
    };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        store: { select: { name: true, username: true } },
        address: { select: { city: true, state: true, country: true, phone: true } },
        orderItems: { include: { product: { select: { name: true } } } },
      },
    });

    const headers = [
      "Order ID", "Date", "Status", "Store", "Customer", "Customer Email",
      "Phone", "City", "State", "Payment Method", "Is Paid", "Total (₦)", "Items", "Tracking",
    ];

    const rows = orders.map((o) => {
      const items = o.orderItems.map((i) => `${i.product?.name ?? "?"} x${i.quantity}`).join("; ");
      return row([
        o.id,
        new Date(o.createdAt).toISOString().slice(0, 10),
        o.status,
        o.store?.name ?? "",
        o.user?.name ?? "",
        o.user?.email ?? "",
        o.address?.phone ?? "",
        o.address?.city ?? "",
        o.address?.state ?? "",
        o.paymentMethod,
        o.isPaid ? "Yes" : "No",
        o.total.toFixed(2),
        items,
        o.trackingNumber ?? "",
      ]);
    });

    const csv = [row(headers), ...rows].join("\n");
    const filename = `all-orders-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
