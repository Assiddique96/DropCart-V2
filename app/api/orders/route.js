// funtions to create order and get orders
import { NextResponse } from "next/server";
import prisma from "@/src/db";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@/src/generated/prisma";

import { sanitizeString } from "@/lib/sanitize";
import { inngest } from "@/inngest/client";
import { isOrderConsideredPaid } from "@/lib/orderPayment";
import { createNotifications } from "@/lib/serverNotifications";

// create order
export async function POST(request) {
  // Rate limit: max 5 orders per minute per IP

  try {
    const { userId, has } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user is banned
    const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { isBanned: true, banReason: true } });
    if (userRecord?.isBanned) {
      return NextResponse.json({ error: `Your account has been suspended. ${userRecord.banReason || ''}`.trim() }, { status: 403 });
    }
    const { addressId, items: rawItems, couponCode: rawCouponCode, paymentMethod, notes: rawNotes } =
      await request.json();

    const items = Array.isArray(rawItems) ? rawItems.map(item => ({
      ...item,
      productId: item.productId || item.id,
    })) : [];

    // Sanitize inputs
    const couponCode = rawCouponCode ? sanitizeString(rawCouponCode, 50).toUpperCase() : null;
    const notes = rawNotes ? sanitizeString(rawNotes, 500) : null;
    // check if all required fields are present
    if (!addressId || !items || items.length === 0 || !paymentMethod) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    if (items.some(item => !item.productId || typeof item.quantity !== 'number' || item.quantity <= 0)) {
      return NextResponse.json(
        { message: "Invalid cart items" },
        { status: 400 },
      );
    }
    // check coupon
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: {
          code: couponCode
        },
      });
    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 400 },
      );
    }  
    }


    // NEW USER ELIGIBILITY CHECK
    if (couponCode && coupon.forNewUser) {
      const userOrders = await prisma.order.findMany({
        where: {
          userId: userId,
        },
      });
      if (userOrders.length > 0) {
        return NextResponse.json(
          { error: "Coupon code valid for NEW users only" },
          { status: 400 },
        );
      }
    }
    // NEW MEMBER ELIGIBILITY CHECK
    const isPlusMemeber = has({ plan: `plus` });
    if (couponCode && coupon.forMember) {
      
      if (!isPlusMemeber) {
        return NextResponse.json(
          { error: "Coupon code valid for MEMBERS ONLY" },
          { status: 404 },
        );
      }
    }

    // Group orders by store using a map, tracking product origins
    const ordersByStore = new Map();
    for (const item of items) {
        const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { storeId: true, price: true, origin: true, acceptCod: true, variantGroups: { include: { options: true } } }
        });
        if (!product) continue;
        const storeId = product.storeId;

        // Calculate effective price with variant modifiers
        let effectivePrice = product.price;
        if (item.variants && product.variantGroups) {
            for (const group of product.variantGroups) {
                const selectedOptionLabel = item.variants[group.label];
                if (selectedOptionLabel) {
                    const option = group.options.find(o => o.label === selectedOptionLabel);
                    if (option) {
                        effectivePrice += option.priceModifier;
                    }
                }
            }
        }

        if (!ordersByStore.has(storeId)) {
            ordersByStore.set(storeId, []);
        }
        ordersByStore.get(storeId).push({
            ...item,
            price: effectivePrice,
            origin: product.origin ?? 'LOCAL',
            acceptCod: product.acceptCod !== false,
        });
    }

    const flatOrderItems = Array.from(ordersByStore.values()).flat();
    const hasAbroadItems = flatOrderItems.some((item) => item.origin === "ABROAD");
    const codNotAllowed = flatOrderItems.some(
        (item) => item.origin === "ABROAD" || (item.origin === "LOCAL" && item.acceptCod === false),
    );

    if (paymentMethod === "COD" && codNotAllowed) {
        return NextResponse.json(
            {
                error: hasAbroadItems
                    ? "Cash on Delivery is not available for internationally shipped (Shipped from Abroad) products. Please choose an online payment method."
                    : "Cash on Delivery is not available for one or more items in your cart. Please choose an online payment method or remove those items.",
            },
            { status: 400 },
        );
    }

    // ── Fetch dynamic shipping config from DB ───────────────────────────
    let shippingLocalFee  = 7000;   // local product shipping
    let shippingAbroadFee = 15000;  // abroad product shipping
    let shippingFreeAbove = 0;
    try {
      const configRows = await prisma.platformConfig.findMany({
        where: { key: { in: ["shipping_base_fee", "shipping_abroad_fee", "shipping_free_above"] } },
      });
      configRows.forEach((r) => {
        if (r.key === "shipping_base_fee")    shippingLocalFee  = parseFloat(r.value);
        if (r.key === "shipping_abroad_fee")  shippingAbroadFee = parseFloat(r.value);
        if (r.key === "shipping_free_above")  shippingFreeAbove = parseFloat(r.value);
      });
    } catch {
      // non-fatal — use defaults
    }

    let orderIds = [];
    let fullAmount = 0;
    let isShippingFeeAdded = false;

    // Create separate orders for each store
    for (const [storeId, sellerItems] of ordersByStore.entries()) {
        let total = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // apply coupon discount (percentage or fixed amount)
        if (couponCode) {
            if (coupon.discountType === 'FIXED') {
                total = Math.max(0, total - coupon.discount);
            } else {
                total -= (total * coupon.discount) / 100;
            }
        }

        // Shipping: use the most expensive origin fee in this store's items
        // (abroad beats local — if any item is ABROAD the higher fee applies)
        const storeHasAbroad = sellerItems.some(i => i.origin === 'ABROAD');
        const applicableShippingFee = storeHasAbroad ? shippingAbroadFee : shippingLocalFee;

        const qualifiesForFreeShipping = !storeHasAbroad && shippingFreeAbove > 0 && total >= shippingFreeAbove;

        if (!isPlusMemeber && !isShippingFeeAdded && !qualifiesForFreeShipping) {
            total += applicableShippingFee;
            isShippingFeeAdded = true;
        }

        const normalizedSellerItems = Object.values(
            sellerItems.reduce((acc, item) => {
                const variantKey = item.variants && Object.keys(item.variants).length
                    ? JSON.stringify(item.variants)
                    : '';
                const key = `${item.productId}::${variantKey}`;
                if (!acc[key]) {
                    acc[key] = {
                        ...item,
                        variants: item.variants || {},
                    };
                } else {
                    acc[key].quantity += item.quantity;
                }
                return acc;
            }, {}),
        );

        total = parseFloat(total.toFixed(2));
        fullAmount += total;

        const order = await prisma.order.create({
            data: {
                userId,
                storeId,
                addressId,
                total: parseFloat((total).toFixed(2)),
                paymentMethod,
                notes,
                isCouponUsed: couponCode ? true : false,
                coupon: coupon ? coupon : {},
                orderItems: {
                    create: normalizedSellerItems.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        variants: item.variants || {}
                    }))
                }
            }
        });
        orderIds.push(order.id);

    }

    // clear user's cart and increment coupon usage
    await prisma.user.update({
        where: { id: userId },
        data: { cart: {}}
    });

    // Increment coupon usage count
    if (couponCode && coupon) {
        await prisma.coupon.update({
            where: { code: couponCode },
            data: { usageCount: { increment: 1 } },
        }).catch(() => {}); // non-fatal
    }

    // In-app + email: persist DB notifications first; Inngest can fail without blocking the tray
    try {
        const buyer = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
        const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
        const dbNotifications = [{
            userId,
            type: 'order',
            title: 'Order placed',
            message: `Your order has been placed successfully.${orderIds.length > 1 ? ` ${orderIds.length} orders were created.` : ''}`,
            link: '/orders',
        }];

        /** @type {Array<{ storeEmail: string, storeName: string, orderId: string, orderTotal: number }>} */
        const inngestSellerPushes = [];

        for (const [storeId] of ordersByStore.entries()) {
            const store = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true, email: true, userId: true } });
            const storeOrder = await prisma.order.findFirst({ where: { storeId, userId }, orderBy: { createdAt: 'desc' } });
            if (store && storeOrder) {
                dbNotifications.push({
                    userId: store.userId,
                    type: 'order',
                    title: 'New order received',
                    message: `You have a new order from ${buyer?.name || 'a customer'}.`,
                    link: '/store/orders',
                });
                inngestSellerPushes.push({
                    storeEmail: store.email,
                    storeName: store.name,
                    orderId: storeOrder.id,
                    orderTotal: storeOrder.total,
                });
            }
        }

        try {
            await createNotifications(dbNotifications);
        } catch (dbNotifError) {
            console.error("DB notification create error (non-fatal):", dbNotifError);
        }

        if (buyer) {
            try {
                await inngest.send({
                    name: "app/order.confirmed",
                    data: {
                        orderId: orderIds.join(', '),
                        userEmail: buyer.email,
                        userName: buyer.name,
                        orderTotal: fullAmount,
                        currency,
                        items: Array.from(ordersByStore.values()).flat().map(i => ({
                            name: i.name || i.id,
                            quantity: i.quantity,
                            price: i.price,
                        })),
                    }
                });
            } catch (e) {
                console.error("Inngest app/order.confirmed (non-fatal):", e);
            }
        }

        for (const s of inngestSellerPushes) {
            try {
                await inngest.send({
                    name: "app/order.new",
                    data: {
                        storeEmail: s.storeEmail,
                        storeName: s.storeName,
                        orderId: s.orderId,
                        orderTotal: s.orderTotal,
                        currency,
                    }
                });
            } catch (e) {
                console.error("Inngest app/order.new (non-fatal):", e);
            }
        }
    } catch (notifError) {
        console.error("Notification error (non-fatal):", notifError);
    }

    return NextResponse.json({ message: "Order created successfully", orderIds, fullAmount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}


// Get orders for a user
export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                address: true,
                refund: true,
                orderItems: {
                    include: {
                        product: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const ordersOut = orders.map((o) => ({
            ...o,
            isPaid: isOrderConsideredPaid(o),
        }));

        return NextResponse.json({ orders: ordersOut });
    } catch (error) {
        //console.error(error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
