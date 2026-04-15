import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";
import { isOrderConsideredPaid } from "@/lib/orderPayment";
import { looseLimiter } from "@/lib/rateLimit";

/**
 * GET /api/orders/invoice?orderId=xxx
 * Returns a full HTML invoice the browser can print or save as PDF.
 * Only the buyer or the seller of the order can access their respective invoices.
 */
export async function GET(request) {
  const limit = looseLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        address: true,
        store: { select: { name: true, email: true, address: true, logo: true } },
        orderItems: { include: { product: { select: { name: true, category: true } } } },
      },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Allow buyer OR seller to download
    const isBuyer  = order.userId === userId;
    const isSeller = order.store?.userId === userId;
    // Check seller via store relation
    const store = await prisma.store.findUnique({ where: { id: order.storeId }, select: { userId: true } });
    const isSellerUser = store?.userId === userId;

    if (!isBuyer && !isSellerUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const paid = isOrderConsideredPaid(order);
    const itemsSubtotal = order.orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingFee   = order.total - itemsSubtotal;
    const invoiceNum    = `INV-${order.id.slice(-8).toUpperCase()}`;
    const issueDate     = new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "long" });

    const itemRows = order.orderItems.map(item => `
      <tr>
        <td>${item.product?.name || "Product"}</td>
        <td class="center">${item.product?.category || "—"}</td>
        <td class="right">${formatCurrency(item.price)}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoiceNum}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; font-size: 13px; line-height: 1.6; padding: 40px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .brand { font-size: 28px; font-weight: 700; color: #0f172a; letter-spacing: -1px; }
    .brand span { color: #64748b; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 20px; color: #0f172a; margin-bottom: 4px; }
    .invoice-meta p { color: #64748b; font-size: 12px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 6px; }
    .badge.paid { background: #dcfce7; color: #166534; }
    .badge.unpaid { background: #fef9c3; color: #854d0e; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .parties { display: flex; gap: 40px; margin-bottom: 32px; }
    .party h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 8px; }
    .party p { color: #334155; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead { background: #f8fafc; }
    th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    tr:last-child td { border-bottom: none; }
    .center { text-align: center; }
    .right { text-align: right; }
    .totals { margin-left: auto; width: 260px; }
    .totals table td { font-size: 13px; }
    .totals .grand-total td { font-weight: 700; font-size: 15px; color: #0f172a; border-top: 2px solid #e2e8f0; padding-top: 12px; }
    .footer { margin-top: 48px; text-align: center; color: #94a3b8; font-size: 11px; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Drop<span>Cart</span><span style="font-size:36px;line-height:0;color:#0f172a">.</span></div>
      <p style="color:#64748b;margin-top:4px;font-size:12px">${order.store?.name || "DropCart Marketplace"}</p>
    </div>
    <div class="invoice-meta">
      <h2>${invoiceNum}</h2>
      <p>Issued: ${issueDate}</p>
      <p>Payment: ${order.paymentMethod}</p>
      <span class="badge ${paid ? 'paid' : 'unpaid'}">${paid ? 'PAID' : 'PAYMENT PENDING'}</span>
    </div>
  </div>

  <hr class="divider" />

  <div class="parties">
    <div class="party">
      <h4>Billed To</h4>
      <p><strong>${order.user?.name || "Customer"}</strong></p>
      <p>${order.user?.email || ""}</p>
      <p>${order.address?.street || ""}</p>
      <p>${[order.address?.city, order.address?.state, order.address?.zip].filter(Boolean).join(", ")}</p>
      <p>${order.address?.country || ""}</p>
      <p>${order.address?.phone || ""}</p>
    </div>
    <div class="party">
      <h4>From</h4>
      <p><strong>${order.store?.name || "DropCart"}</strong></p>
      <p>${order.store?.email || ""}</p>
      <p>${order.store?.address || ""}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="center">Category</th>
        <th class="right">Unit Price</th>
        <th class="center">Qty</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Subtotal</td><td class="right">${formatCurrency(itemsSubtotal)}</td></tr>
      ${shippingFee > 0.01 ? `<tr><td>Shipping</td><td class="right">${formatCurrency(shippingFee)}</td></tr>` : ""}
      ${order.isCouponUsed ? `<tr><td>Coupon (${order.coupon?.code || ""})</td><td class="right">-${order.coupon?.discount || 0}%</td></tr>` : ""}
      <tr class="grand-total"><td>Total</td><td class="right">${formatCurrency(order.total)}</td></tr>
    </table>
  </div>

  <hr class="divider" />
  <div class="footer">
    <p>Thank you for shopping with DropCart. For support: support@dropcart.ng</p>
    <p style="margin-top:4px">Order ID: ${order.id} &nbsp;|&nbsp; Generated ${new Date().toLocaleString()}</p>
  </div>

  <script>
    // Auto-trigger print dialog when opened in a new tab
    window.addEventListener('load', () => {
      if (window.location.search.includes('print=1')) window.print();
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
