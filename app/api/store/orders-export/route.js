import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authSeller from "@/middlewares/authSeller";

function escapeCsvField(value) {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields) {
  return fields.map(escapeCsvField).join(",");
}

/**
 * GET /api/store/orders-export
 * Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&status=...
 * Returns a CSV file of the seller's orders.
 */
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId, request.headers.get("x-store-id"));
    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");

    const where = {
      storeId,
      ...(status ? { status } : {}),
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
        address: { select: { city: true, state: true, country: true, phone: true } },
        orderItems: {
          include: { product: { select: { name: true, sku: true } } },
        },
      },
    });

    const headers = [
      "Order ID",
      "Date",
      "Status",
      "Customer Name",
      "Customer Email",
      "Phone",
      "City",
      "State",
      "Country",
      "Payment Method",
      "Is Paid",
      "Total (₦)",
      "Items",
      "Tracking Number",
    ];

    const rows = orders.map((o) => {
      const items = o.orderItems
        .map((i) => `${i.product?.name ?? "Unknown"} x${i.quantity}`)
        .join("; ");
      return toCsvRow([
        o.id,
        new Date(o.createdAt).toISOString().slice(0, 10),
        o.status,
        o.user?.name ?? "",
        o.user?.email ?? "",
        o.address?.phone ?? "",
        o.address?.city ?? "",
        o.address?.state ?? "",
        o.address?.country ?? "",
        o.paymentMethod,
        o.isPaid ? "Yes" : "No",
        o.total.toFixed(2),
        items,
        o.trackingNumber ?? "",
      ]);
    });

    const csv = [toCsvRow(headers), ...rows].join("\n");
    const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[orders-export]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
