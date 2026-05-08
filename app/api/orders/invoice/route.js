import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import { formatCurrency } from "@/lib/currency";
import { isOrderConsideredPaid } from "@/lib/orderPayment";
import logo from "@/assets/logo.png"; // adjust path/name to your actual logo asset

/**
 * GET /api/orders/invoice?orderId=xxx&tz=Africa/Lagos
 * Returns a full HTML invoice the browser can print or save as PDF.
 * Only the buyer or the seller of the order can access their respective invoices.
 */
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const timeZone = searchParams.get("tz") || undefined; // buyer's IANA timezone

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        address: true,
        store: {
          select: {
            name: true,
            email: true,
            address: true,
            logo: true,
            userId: true,
          },
        },
        orderItems: {
          include: {
            product: { select: { name: true, category: true } },
          },
        },
        // coupon: true, // coupon is scalar, not relation
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Allow buyer OR seller to download
    const isBuyer = order.userId === userId;
    const isSellerUser = order.store?.userId === userId;

    if (!isBuyer && !isSellerUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const paid = isOrderConsideredPaid(order);
    const itemsSubtotal = order.orderItems.reduce(
      (s, i) => s + i.price * i.quantity,
      0
    );
    const shippingFee = order.total - itemsSubtotal;
    const invoiceNum = `INV-${order.id.slice(-8).toUpperCase()}`;
    const issueDate = new Date(order.createdAt).toLocaleDateString("en-NG", {
      dateStyle: "long",
    });

    // "Generated on" in buyer's timezone (if provided)
    const now = new Date();
    const generatedAt = timeZone
      ? new Intl.DateTimeFormat("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone,
        }).format(now)
      : now.toLocaleString("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
        });

    const itemRows = order.orderItems
      .map(
        (item) => `
      <tr>
        <td>
          <div class="item-name">${item.product?.name || "Product"}</div>
          ${
            item.product?.category
              ? `<div class="item-meta">${item.product.category}</div>`
              : ""
          }
        </td>
        <td class="right">${formatCurrency(item.price)}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `
      )
      .join("");

    const storeLogo = order.store?.logo || logo;
    const storeName = order.store?.name || "Shpinx";
    const storeEmail = order.store?.email || "support@shpinx.ng";
    const storeAddress = order.store?.address || "";

    // Adjust these field names to match your actual schema:
    // e.g. isCouponUsed: Boolean, couponCode: String?, couponDiscount: Int?
    const couponRow =
      order.isCouponUsed && order.couponCode
        ? `<tr>
             <td>Discount (${order.couponCode})</td>
             <td class="right">-${order.couponDiscount || 0}%</td>
           </tr>`
        : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoiceNum}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #0f172a;
      font-size: 13px;
      line-height: 1.6;
      padding: 40px;
      background: #f8fafc;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 30px rgba(15,23,42,0.07);
      padding: 32px 36px 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 28px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 20px;
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-logo {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
    }
    .brand-logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .brand-name {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #0f172a;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
    }
    .invoice-meta {
      text-align: right;
      font-size: 12px;
    }
    .invoice-meta-title {
      font-size: 22px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .invoice-meta p {
      color: #64748b;
      margin-bottom: 2px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .badge.paid {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .badge.unpaid {
      background: #fef3c7;
      color: #854d0e;
      border: 1px solid #fde68a;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin: 24px 0 28px;
      font-size: 13px;
    }
    .party {
      flex: 1;
    }
    .party-header {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .party-name {
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 3px;
    }
    .party p {
      color: #475569;
      margin-bottom: 2px;
    }
    .party p:last-child {
      margin-bottom: 0;
    }
    .invoice-summary {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 40px;
      padding: 14px 16px;
      border-radius: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
      font-size: 12px;
    }
    .summary-block {
      flex: 1;
    }
    .summary-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .summary-value {
      color: #0f172a;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    thead {
      background: #f9fafb;
    }
    th {
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .center {
      text-align: center;
    }
    .right {
      text-align: right;
    }
    .item-name {
      font-weight: 500;
      color: #0f172a;
    }
    .item-meta {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .totals {
      margin-left: auto;
      width: 260px;
      font-size: 13px;
    }
    .totals table {
      margin-bottom: 0;
    }
    .totals td {
      border: none;
      padding: 4px 0;
    }
    .totals-row-label {
      color: #64748b;
    }
    .totals-row-value {
      text-align: right;
      color: #0f172a;
    }
    .grand-total-row td {
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
    }
    .footer {
      margin-top: 32px;
      text-align: center;
      color: #94a3b8;
      font-size: 11px;
    }
    .footer p + p {
      margin-top: 4px;
    }
    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }
      .invoice-container {
        box-shadow: none;
        border-radius: 0;
        border: none;
      }
      @page {
        margin: 1.2cm;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <header class="header">
      <div class="brand-block">
        <div class="brand-logo">
          <img src="${storeLogo}" alt="${storeName} Logo" />
        </div>
        <div class="brand-text">
          <div class="brand-name">${storeName}</div>
          <div class="brand-sub">Order invoice</div>
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-meta-title">Invoice ${invoiceNum}</div>
        <p>Order ID: ${order.id}</p>
        <p>Issued: ${issueDate}</p>
        <p>Payment method: ${order.paymentMethod}</p>
        <span class="badge ${paid ? "paid" : "unpaid"}">
          ${paid ? "Paid" : "Payment pending"}
        </span>
      </div>
    </header>

    <section class="parties">
      <div class="party">
        <div class="party-header">Billed to</div>
        <p class="party-name">${order.user?.name || "Customer"}</p>
        <p>${order.user?.email || ""}</p>
        <p>${order.address?.street || ""}</p>
        <p>${[order.address?.city, order.address?.state, order.address?.zip]
          .filter(Boolean)
          .join(", ")}</p>
        <p>${order.address?.country || ""}</p>
        <p>${order.address?.phone || ""}</p>
      </div>
      <div class="party">
        <div class="party-header">Sold by</div>
        <p class="party-name">${storeName}</p>
        <p>${storeEmail}</p>
        <p>${storeAddress}</p>
      </div>
    </section>

    <section class="invoice-summary">
      <div class="summary-block">
        <div class="summary-label">Order date</div>
        <div class="summary-value">${issueDate}</div>
      </div>
      <div class="summary-block">
        <div class="summary-label">Status</div>
        <div class="summary-value">${paid ? "Paid" : "Pending payment"}</div>
      </div>
      <div class="summary-block">
        <div class="summary-label">Total</div>
        <div class="summary-value">${formatCurrency(order.total)}</div>
      </div>
    </section>

    <section>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="right">Unit price</th>
            <th class="center">Qty</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </section>

    <section class="totals">
      <table>
        <tr>
          <td class="totals-row-label">Subtotal</td>
          <td class="totals-row-value">${formatCurrency(itemsSubtotal)}</td>
        </tr>
        ${
          shippingFee > 0.01
            ? `<tr>
                 <td class="totals-row-label">Shipping</td>
                 <td class="totals-row-value">${formatCurrency(shippingFee)}</td>
               </tr>`
            : ""
        }
        ${couponRow}
        <tr class="grand-total-row">
          <td>Total</td>
          <td class="totals-row-value">${formatCurrency(order.total)}</td>
        </tr>
      </table>
    </section>

    <footer class="footer">
      <p>Thank you for shopping with ${storeName}.</p>
      <p>For support: ${storeEmail}</p>
      <p>Generated on ${generatedAt}${timeZone ? ` (${timeZone})` : ""}</p>
      <p>Powered by Shpinx</p>
    </footer>
  </div>

  <script>
    window.addEventListener('load', () => {
      if (window.location.search.includes('print=1')) {
        window.print();
      }
    });
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${invoiceNum}.html"`,
      },
    });
  } catch (error) {
    console.error("Invoice error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
