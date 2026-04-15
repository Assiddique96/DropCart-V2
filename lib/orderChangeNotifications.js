/**
 * Build in-app (Redux) notifications when buyer/store order data changes between polls.
 */

const ORDERS_LINK = '/orders'
const STORE_ORDERS_LINK = '/store/orders'

function statusLabel(status) {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function buyerStatusMessage(nextStatus) {
    if (nextStatus === 'CANCELLED') {
        return 'Your order has been cancelled.'
    }
    if (nextStatus === 'DELIVERED') {
        return 'Your order has been delivered.'
    }
    if (nextStatus === 'SHIPPED') {
        return 'Your order is on the way.'
    }
    if (nextStatus === 'PROCESSING') {
        return 'The store is preparing your order.'
    }
    if (nextStatus === 'ORDER_PLACED') {
        return 'Your order is confirmed.'
    }
    return `Order status updated to ${statusLabel(nextStatus)}.`
}

function buyerRefundTitle(status) {
    switch (status) {
        case 'REQUESTED':
            return 'Refund update'
        case 'APPROVED':
            return 'Refund approved'
        case 'REJECTED':
            return 'Refund request declined'
        case 'REFUNDED':
            return 'Refund completed'
        default:
            return 'Refund update'
    }
}

function buyerRefundMessage(status) {
    switch (status) {
        case 'REQUESTED':
            return 'Your refund request was received and is being reviewed.'
        case 'APPROVED':
            return 'Your refund was approved. You will be notified when it is processed.'
        case 'REJECTED':
            return 'Your refund request was not approved. Check your order details for more information.'
        case 'REFUNDED':
            return 'Your refund has been issued.'
        default:
            return 'Your refund status was updated.'
    }
}

function storeRefundTitle(status) {
    switch (status) {
        case 'REQUESTED':
            return 'New refund request'
        case 'APPROVED':
            return 'Refund approved (admin)'
        case 'REJECTED':
            return 'Refund rejected (admin)'
        case 'REFUNDED':
            return 'Refund marked complete'
        default:
            return 'Refund update'
    }
}

function storeRefundMessage(orderId, status) {
    const short = orderId.length > 10 ? `${orderId.slice(0, 8)}…` : orderId
    switch (status) {
        case 'REQUESTED':
            return `A buyer requested a refund for order ${short}.`
        case 'APPROVED':
            return `Refund was approved for order ${short}.`
        case 'REJECTED':
            return `Refund was declined for order ${short}.`
        case 'REFUNDED':
            return `Refund completed for order ${short}.`
        default:
            return `Refund status changed for order ${short}.`
    }
}

/** @param {Record<string, { status: string, refundStatus: string | null }>} previous */
export function buildBuyerOrderNotifications(previous, orders, initialized) {
    /** @type {Array<{ type: string, title: string, message: string, link: string }>} */
    const notifications = []
    const next = {}

    for (const o of orders) {
        const refundStatus = o.refund?.status ?? null
        next[o.id] = { status: o.status, refundStatus }
        if (!initialized || !previous[o.id]) continue

        const p = previous[o.id]
        if (p.status !== o.status) {
            notifications.push({
                type: 'order',
                title: `Order ${statusLabel(o.status)}`,
                message: buyerStatusMessage(o.status),
                link: ORDERS_LINK,
            })
        }
        if (p.refundStatus !== refundStatus && refundStatus !== null) {
            notifications.push({
                type: 'order',
                title: buyerRefundTitle(refundStatus),
                message: buyerRefundMessage(refundStatus),
                link: ORDERS_LINK,
            })
        }
    }

    return { notifications, map: next }
}

/** @param {Record<string, { status: string, refundStatus: string | null }>} previous */
export function buildStoreOrderNotifications(previous, orders, initialized) {
    /** @type {Array<{ type: string, title: string, message: string, link: string }>} */
    const notifications = []
    const next = {}

    for (const o of orders) {
        const refundStatus = o.refund?.status ?? null
        next[o.id] = { status: o.status, refundStatus }
        if (!initialized) continue

        if (!previous[o.id]) {
            notifications.push({
                type: 'order',
                title: 'New order received',
                message: `You have a new order (${o.user?.name || 'Customer'}).`,
                link: STORE_ORDERS_LINK,
            })
            continue
        }

        const p = previous[o.id]
        if (p.refundStatus !== refundStatus && refundStatus !== null) {
            notifications.push({
                type: 'order',
                title: storeRefundTitle(refundStatus),
                message: storeRefundMessage(o.id, refundStatus),
                link: STORE_ORDERS_LINK,
            })
        }
    }

    return { notifications, map: next }
}
