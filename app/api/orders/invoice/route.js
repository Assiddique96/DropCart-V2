import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import { formatCurrency } from "@/lib/currency";
import { isOrderConsideredPaid } from "@/lib/orderPayment";
import logo from "@/assets/logo.png";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
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
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

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

    // --- SHIPPING: use values saved at checkout ---
    // Expect fields like: shippingFee Int/Decimal, shippingMethod String?
    const shippingFeeFromCheckout =
      typeof order.shippingFee === "number" ? order.shippingFee : 0;
    const shippingMethod = order.shippingMethod || "Standard shipping";
    // Fallback for legacy orders that don't have shippingFee yet:
    const shippingFee =
      shippingFeeFromCheckout || order.total - itemsSubtotal;
    // --- end SHIPPING block ---

    // --- VAT & TAX (from checkout) ---
    const storedVatRate =
      typeof order.vatRate === "number" ? order.vatRate : null;
    const storedVatAmount =
      typeof order.vatAmount === "number" ? order.vatAmount : null;

    const storedTaxRate =
      typeof order.taxRate === "number" ? order.taxRate : null;
    const storedTaxAmount =
      typeof order.taxAmount === "number" ? order.taxAmount : null;

    const vatRate = storedVatRate ?? 0;
    const taxRate = storedTaxRate ?? 0;

    const taxableBase = order.subtotal ?? itemsSubtotal;

    const vatAmount =
      storedVatAmount ?? Math.round(taxableBase * vatRate);

    const taxAmount =
      storedTaxAmount ?? Math.round(taxableBase * taxRate);

    const totalBeforeVatTax = taxableBase + shippingFee;
    const totalWithVat =
      typeof order.totalWithVat === "number"
        ? order.totalWithVat
        : totalBeforeVatTax + vatAmount + taxAmount;
    // --- end VAT & TAX ---

    const invoiceNum = `INV-${order.id.slice(-8).toUpperCase()}`;
    const issueDate = new Date(order.createdAt).toLocaleDateString("en-NG", {
      dateStyle: "long",
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

    const couponRow =
      order.isCouponUsed && order.couponCode
        ? `<tr>
             <td class="totals-row-label">Discount (${order.couponCode})</td>
             <td class="totals-row-value">-${order.couponDiscount || 0}%</td>
           </tr>`
        : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- styles omitted for brevity; keep your existing CSS -->
</head>
<body>
  <div class="invoice-container">
    <!-- header, parties, items... -->

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
        <div class="summary-label">Total (incl. VAT)</div>
        <div class="summary-value">${formatCurrency(totalWithVat)}</div>
      </div>
    </section>

    <section class="totals">
      <table>
        <tr>
          <td class="totals-row-label">Subtotal (tax base)</td>
          <td class="totals-row-value">${formatCurrency(taxableBase)}</td>
        </tr>
        ${
          shippingFee > 0.01
            ? `<tr>
                 <td class="totals-row-label">Shipping (${shippingMethod})</td>
                 <td class="totals-row-value">${formatCurrency(shippingFee)}</td>
               </tr>`
            : ""
        }

        <!-- Tax / VAT section -->
        <tr>
          <td class="totals-row-label">Taxable amount</td>
          <td class="totals-row-value">${formatCurrency(taxableBase)}</td>
        </tr>
        <tr>
          <td class="totals-row-label">VAT rate</td>
          <td class="totals-row-value">${(vatRate * 100).toFixed(2)}%</td>
        </tr>
        <tr>
          <td class="totals-row-label">VAT amount</td>
          <td class="totals-row-value">${formatCurrency(vatAmount)}</td>
        </tr>
        ${
          taxRate > 0 || taxAmount > 0
            ? `
        <tr>
          <td class="totals-row-label">Additional tax rate</td>
          <td class="totals-row-value">${(taxRate * 100).toFixed(2)}%</td>
        </tr>
        <tr>
          <td class="totals-row-label">Additional tax amount</td>
          <td class="totals-row-value">${formatCurrency(taxAmount)}</td>
        </tr>`
            : ""
        }
        <!-- end Tax / VAT section -->

        ${couponRow}
        <tr class="grand-total-row">
          <td>Total including VAT</td>
          <td class="totals-row-value">${formatCurrency(totalWithVat)}</td>
        </tr>
      </table>
    </section>

    <footer class="footer">
      <p>Thank you for shopping with ${storeName}.</p>
      <p>For support: ${storeEmail}</p>
      <p>
        Generated on
        <span id="generated-at" data-created-at="${order.createdAt.toISOString()}"></span>
      </p>
      <p>Powered by Shpinx</p>
    </footer>
  </div>

  <script>
    window.addEventListener('load', () => {
      const el = document.getElementById('generated-at');
      if (el && el.dataset.createdAt) {
        const utcDate = new Date(el.dataset.createdAt);
        const formatted = new Intl.DateTimeFormat(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(utcDate);
        el.textContent = formatted;
      }
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
