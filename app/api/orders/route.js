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

  console.log('[DEBUG_ORDER] POST handler invoked');

  try {
    const { userId, has } = getAuth(request);
    console.log(`[DEBUG_ORDER] auth userId=${userId ? userId : 'null'}`);
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
        { message: "Invalid cart items", debug: { items } },
        { status: 400 },
      );
    }

    const address = await prisma.address.findUnique({
      where: { id: addressId },
      select: { id: true, userId: true, state: true, country: true },
    });

    if (!address || address.userId !== userId) {
      return NextResponse.json(
        { error: "Invalid shipping address", debug: { addressId, address } },
        { status: 400 },
      );
    }

    const buyerState = String(address.state || "").trim().toLowerCase();
    const buyerCountry = String(address.country || "").trim().toLowerCase();
    console.log(`[DEBUG_ORDER] addressId=${addressId} buyerState='${buyerState}' buyerCountry='${buyerCountry}' addressState='${address.state}' addressCountry='${address.country}'`);

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

    // Group orders by store using a map, tracking product origins and stock usage.
    let shippingLocalFee  = 7000;
    let shippingAbroadFee = 15000;
    let shippingFreeAbove = 0;
    let taxRate           = 0; // platform VAT/tax percentage
    let commissionRate    = 5; // % of product subtotal kept by the platform

    const ordersByStore = new Map();
    const productQuantityMap = new Map();
    const productStockUsage = new Map();
    const variantOptionQuantityMap = new Map();
    const variantOptionStockUsage = new Map();
    const storeShipping = new Map();

    try {
      const configRows = await prisma.platformConfig.findMany({
        where: { key: { in: ["shipping_base_fee", "shipping_abroad_fee", "shipping_free_above", "tax_rate", "commission_rate"] } },
      });
      configRows.forEach((r) => {
        if (r.key === "shipping_base_fee")    shippingLocalFee  = parseFloat(r.value);
        if (r.key === "shipping_abroad_fee")  shippingAbroadFee = parseFloat(r.value);
        if (r.key === "shipping_free_above")  shippingFreeAbove = parseFloat(r.value);
        if (r.key === "tax_rate")             taxRate           = parseFloat(r.value);
        if (r.key === "commission_rate")      commissionRate    = parseFloat(r.value);
      });
    } catch {
      // non-fatal — use defaults
    }

    for (const item of items) {
        const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: {
                id: true,
                storeId: true,
                name: true,
                price: true,
                origin: true,
                acceptCod: true,
                deliveryWithinState: true,
                deliveryNationwide: true,
                deliveryInternational: true,
                quantity: true,
                inStock: true,
                isWholesale: true,
                useDefaultShipping: true,
                customLocalFee: true,
                customNationwideFee: true,
                customAbroadFee: true,
                wholesaleTiers: { orderBy: { minQty: "asc" } },
                variantGroups: { include: { options: true } },
                store: {
                    select: {
                        state: true,
                        deliveryStates: true,
                        country: true,
                        shippingLocalFee: true,
                        shippingNationwideFee: true,
                        shippingAbroadFee: true,
                        shippingFreeAbove: true,
                    },
                },
            },
        });

        if (!product) continue;

        console.log(`[DEBUG_ORDER] item productId=${item.productId} productFound=${!!product} storeId=${product.storeId} origin=${product.origin} deliveryWithinState=${product.deliveryWithinState} deliveryNationwide=${product.deliveryNationwide} storeDeliveryStates=${JSON.stringify(product.store?.deliveryStates)} storeState='${product.store?.state}' storeCountry='${product.store?.country}'`);

        if (!product.inStock || product.quantity < item.quantity) {
            return NextResponse.json(
                { error: `Only ${product.quantity ?? 0} item(s) are available for this product.` },
                { status: 400 },
            );
        }

        if (!productQuantityMap.has(product.id)) {
            productQuantityMap.set(product.id, product.quantity);
        }

        const totalRequestedForProduct = (productStockUsage.get(product.id) || 0) + item.quantity;
        if (totalRequestedForProduct > productQuantityMap.get(product.id)) {
            return NextResponse.json(
                { error: `Only ${product.quantity ?? 0} item(s) are available for this product.` },
                { status: 400 },
            );
        }
        productStockUsage.set(product.id, totalRequestedForProduct);

        if (item.variants && Object.keys(item.variants).length > 0) {
            for (const [groupLabel, selectedOptionLabel] of Object.entries(item.variants)) {
                const group = product.variantGroups.find((g) => g.label === groupLabel);
                if (!group) continue;
                const option = group.options.find((o) => o.label === selectedOptionLabel);
                if (!option || !option.inStock || option.quantity < item.quantity) {
                    return NextResponse.json(
                        { error: `Selected variant ${selectedOptionLabel} is not available in sufficient quantity.` },
                        { status: 400 },
                    );
                }

                if (!variantOptionQuantityMap.has(option.id)) {
                    variantOptionQuantityMap.set(option.id, option.quantity);
                }

                const totalRequestedForOption = (variantOptionStockUsage.get(option.id) || 0) + item.quantity;
                if (totalRequestedForOption > variantOptionQuantityMap.get(option.id)) {
                    return NextResponse.json(
                        { error: `Only ${option.quantity ?? 0} unit(s) of the selected variant ${selectedOptionLabel} are available.` },
                        { status: 400 },
                    );
                }
                variantOptionStockUsage.set(option.id, totalRequestedForOption);
            }
        }

        if (product.origin === "ABROAD" && !product.deliveryInternational) {
            console.warn(`[WARN_ORDER] ABROAD product ${product.id} missing deliveryInternational flag, treating as international shipping`);
        }

        if (product.origin !== "ABROAD" && !product.deliveryWithinState && !product.deliveryNationwide) {
            return NextResponse.json(
                { error: "One or more products in your cart cannot be delivered to the selected address." },
                { status: 400 },
            );
        }

        const storeId = product.storeId;

        // Calculate effective price: wholesale tier > variant modifier > base price
        let effectivePrice = product.price;

        // Resolve wholesale tier price if product has wholesale enabled
        if (product.isWholesale && product.wholesaleTiers && product.wholesaleTiers.length > 0) {
            const qty = item.quantity;
            // Find the best matching tier (highest minQty that is <= qty)
            const matchingTier = product.wholesaleTiers
                .filter(t => t.minQty <= qty && (t.maxQty == null || qty <= t.maxQty))
                .sort((a, b) => b.minQty - a.minQty)[0];
            if (matchingTier) {
                effectivePrice = matchingTier.price;
            }
        }

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
        if (!storeShipping.has(storeId)) {
            storeShipping.set(storeId, {
                localFee: product.store?.shippingLocalFee ?? shippingLocalFee,
                nationwideFee: product.store?.shippingNationwideFee ?? product.store?.shippingLocalFee ?? shippingLocalFee,
                abroadFee: product.store?.shippingAbroadFee ?? shippingAbroadFee,
                freeAbove: product.store?.shippingFreeAbove ?? shippingFreeAbove,
                state: product.store?.state,
                deliveryStates: product.store?.deliveryStates ?? [],
                country: product.store?.country,
            });
        }
        ordersByStore.get(storeId).push({
            ...item,
            price: effectivePrice,
            origin: product.origin ?? 'LOCAL',
            acceptCod: product.acceptCod !== false,
            deliveryWithinState: product.deliveryWithinState !== false,
            deliveryNationwide: product.deliveryNationwide !== false,
            deliveryInternational: product.origin === 'ABROAD' ? true : product.deliveryInternational === true,
            useDefaultShipping: product.useDefaultShipping !== false,
            customLocalFee: product.customLocalFee,
            customNationwideFee: product.customNationwideFee,
            customAbroadFee: product.customAbroadFee,
        });
    }

    if (ordersByStore.size === 0) {
      return NextResponse.json(
        { error: "No valid products found in your cart." },
        { status: 400 },
      );
    }

    const flatOrderItems = Array.from(ordersByStore.values()).flat();
    const hasAbroadItems = flatOrderItems.some((item) => item.origin === "ABROAD");
    const codNotAllowed = flatOrderItems.some(
        (item) => item.origin === "ABROAD" || (item.origin === "LOCAL" && item.acceptCod === false),
    );

    let orderIds = [];
    let fullAmount = 0;

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

    const createdOrders = [];
    await prisma.$transaction(async (tx) => {
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

                const storeConfig = storeShipping.get(storeId) || {};
            const storeLocalFee = storeConfig.localFee ?? shippingLocalFee;
            const storeNationwideFee = storeConfig.nationwideFee ?? storeLocalFee;
            const storeAbroadFee = storeConfig.abroadFee ?? shippingAbroadFee;
            const storeFreeAbove = storeConfig.freeAbove ?? shippingFreeAbove;
            const storeState = String(storeConfig.state || "").trim().toLowerCase();
            const storeDeliveryStates = Array.isArray(storeConfig.deliveryStates)
                ? storeConfig.deliveryStates.map((s) => String(s || "").trim().toLowerCase()).filter(Boolean)
                : [];
            const storeCountry = String(storeConfig.country || "").trim().toLowerCase();
            const sameState = storeDeliveryStates.length > 0
                ? storeDeliveryStates.includes(buyerState)
                : storeState && buyerState && storeState === buyerState;
            const sameCountry = storeCountry && buyerCountry && storeCountry === buyerCountry;

            const storeHasAbroad = sellerItems.some(i => i.origin === 'ABROAD');
            const localItems = sellerItems.filter(i => i.origin !== 'ABROAD');

            const debugContext = {
                buyerState,
                buyerCountry,
                storeState,
                storeDeliveryStates,
                storeCountry,
                sameState,
                sameCountry,
                localItemsCount: localItems.length,
            };
            console.log(`[DEBUG_ORDER] storeId=${storeId} ${JSON.stringify(debugContext)}`);

            if (localItems.length > 0 && !sameCountry) {
                const error = new Error("One or more items in your cart cannot be shipped to the selected address.");
                error.debug = debugContext;
                console.log(`[DEBUG_ORDER] cannot ship due to country mismatch: ${JSON.stringify(debugContext)}`);
                throw error;
            }

            const localCanShip = localItems.every((item) => {
                const withinStateAllowed = sameState && item.deliveryWithinState;
                const nationwideAllowed = sameCountry && item.deliveryNationwide;
                return withinStateAllowed || nationwideAllowed;
            });

            console.log(`[DEBUG_ORDER] storeId=${storeId} localCanShip=${localCanShip} localItemsCount=${localItems.length}`);

            if (!storeHasAbroad && localItems.length > 0 && !localCanShip) {
                const error = new Error("One or more items in your cart are not available for delivery to the selected address.");
                error.debug = debugContext;
                console.log(`[DEBUG_ORDER] cannot ship due to product delivery constraints: ${JSON.stringify(debugContext)}`);
                throw error;
            }

            let applicableShippingFee;
            if (storeHasAbroad) {
                applicableShippingFee = storeAbroadFee;
                const customAbroadFees = sellerItems
                    .filter((i) => i.origin === 'ABROAD' && i.useDefaultShipping === false && i.customAbroadFee != null)
                    .map((i) => i.customAbroadFee);
                if (customAbroadFees.length > 0) {
                    applicableShippingFee = Math.max(applicableShippingFee, ...customAbroadFees);
                }
            } else {
                const requiresNationwide = localItems.some((item) => !item.deliveryWithinState);
                console.log(`[DEBUG_ORDER] storeId=${storeId} requiresNationwide=${requiresNationwide} sameState=${sameState}`);
                if (sameState && !requiresNationwide) {
                    applicableShippingFee = storeLocalFee;
                    const customLocalFees = localItems
                        .filter((i) => i.useDefaultShipping === false && i.customLocalFee != null)
                        .map((i) => i.customLocalFee);
                    if (customLocalFees.length > 0) {
                        applicableShippingFee = Math.max(applicableShippingFee, ...customLocalFees);
                    }
                } else {
                    applicableShippingFee = storeNationwideFee;
                    const customNationwideFees = localItems
                        .filter((i) => i.useDefaultShipping === false && i.customNationwideFee != null)
                        .map((i) => i.customNationwideFee);
                    if (customNationwideFees.length > 0) {
                        applicableShippingFee = Math.max(applicableShippingFee, ...customNationwideFees);
                    }
                }
                console.log(`[DEBUG_ORDER] storeId=${storeId} applicableShippingFee=${applicableShippingFee}`);
            }

            const qualifiesForFreeShipping = !storeHasAbroad && storeFreeAbove > 0 && total >= storeFreeAbove;

            const shippingFeeCharged = (!isPlusMemeber && !qualifiesForFreeShipping) ? applicableShippingFee : 0;
            if (shippingFeeCharged > 0) {
                total += shippingFeeCharged;
            }

            // Commission applies to product subtotal only (not shipping, which
            // passes through to the seller to cover courier costs, and not tax,
            // which is collected on the government's behalf).
            const subtotalForCommission = parseFloat((total - shippingFeeCharged).toFixed(2));
            const platformFee = parseFloat(((subtotalForCommission * commissionRate) / 100).toFixed(2));

            // Apply platform VAT/tax on (subtotal + shipping)
            let taxAmount = 0;
            if (taxRate > 0) {
                taxAmount = parseFloat(((total * taxRate) / 100).toFixed(2));
                total += taxAmount;
            }

            // What the seller is owed: their product revenue plus the shipping
            // fee (to cover courier costs), minus the platform's commission.
            // Tax is excluded — it's collected on the government's behalf.
            const sellerPayout = parseFloat((subtotalForCommission - platformFee + shippingFeeCharged).toFixed(2));

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

            const order = await tx.order.create({
                data: {
                    userId,
                    storeId,
                    addressId,
                    total: parseFloat((total).toFixed(2)),
                    paymentMethod,
                    notes,
                    isCouponUsed: couponCode ? true : false,
                    coupon: coupon ? coupon : {},
                    subtotal: subtotalForCommission,
                    shippingFee: shippingFeeCharged,
                    taxAmount,
                    commissionRate,
                    platformFee,
                    sellerPayout,
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
            createdOrders.push(order);
        }

        for (const [productId, decrementQty] of productStockUsage.entries()) {
            const currentQty = productQuantityMap.get(productId) ?? 0;
            const updated = await tx.product.updateMany({
                where: { id: productId, quantity: { gte: decrementQty } },
                data: {
                    quantity: { decrement: decrementQty },
                    inStock: currentQty - decrementQty > 0,
                },
            });
            if (updated.count === 0) {
                throw new Error(`Unable to reserve stock for product ${productId}`);
            }
        }

        for (const [optionId, decrementQty] of variantOptionStockUsage.entries()) {
            const currentQty = variantOptionQuantityMap.get(optionId) ?? 0;
            const updated = await tx.productVariantOption.updateMany({
                where: { id: optionId, quantity: { gte: decrementQty } },
                data: {
                    quantity: { decrement: decrementQty },
                    inStock: currentQty - decrementQty > 0,
                },
            });
            if (updated.count === 0) {
                throw new Error(`Unable to reserve stock for selected product variant`);
            }
        }
    });

    orderIds = createdOrders.map((order) => order.id);

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
    const responseBody = { error: error.code || error.message };
    if (error?.debug) {
      responseBody.debug = error.debug;
    }
    return NextResponse.json(responseBody, { status: 400 });
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
