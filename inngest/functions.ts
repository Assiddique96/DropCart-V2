import { inngest } from "./client";
import {prisma} from "../src/db"

// Inngest Funtions to save user data to neon database

export const syncUserCreation = inngest.createFunction(
    { 
        id: 'sync-user-create',
        triggers: [{ event: 'clerk/user.created' }] 
    },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.create({
            data: {
                id: data.id,
                email: data.email_addresses[0].email_address,
                name: `${data.first_name} ${data.last_name}`,
                image: data.image_url,
            }
        });
    }
);

// Inngest Function to update user data in Neon database
export const syncUserUpdation = inngest.createFunction(
    { 
        id: 'sync-user-update',
        triggers: [{ event: 'clerk/user.updated' }] 
    },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.update({
            where: { id: data.id },
            data: {
                email: data.email_addresses[0].email_address,
                name: `${data.first_name} ${data.last_name}`,
                image: data.image_url,
            }
        });
    }
);

// Inngest Funtion to delete a user from Neon database
export const syncUserDeletion = inngest.createFunction(
    { 
        id: 'sync-user-delete',
        triggers: [{ event: 'clerk/user.deleted' }] 
    },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.delete({
            where: { id: data.id }
        });
    }
);

// Inngest Funtion to delete coupon on expiration date
export const deleteExpiredCoupons = inngest.createFunction(
    {
        id: 'delete-coupon-on-expiry',
        triggers: [{ event: 'app/coupon.expired' }]
    },
    async ({event, step}) => {
        const { data } = event;
        const expiryDate = new Date(data.expires_at)
        await step.sleepUntil('wait-for-expiry', expiryDate)

        await step.run('delete-coupon-from-database', async () => {
            await prisma.coupon.delete({
                where: { code: data.code }
            })
        })
    }
);

/**
 * Send order confirmation email to buyer.
 * Triggered by: app/order.confirmed
 * Data: { orderId, userEmail, userName, orderTotal, currency, items[] }
 *
 * NOTE: Replace the console.log stub with your email provider
 * (Resend, SendGrid, Nodemailer, etc.). The event payload contains
 * everything needed to render a rich HTML email.
 */
export const sendOrderConfirmationEmail = inngest.createFunction(
    { id: 'send-order-confirmation-email', triggers: [{ event: 'app/order.confirmed' }] },
    async ({ event, step }) => {
        const { orderId, userEmail, userName, orderTotal, currency, items } = event.data;

        await step.run('send-confirmation-email', async () => {
            const itemList = items.map(i => `• ${i.name} × ${i.quantity} — ${currency}${i.price}`).join('\n')

            // ─── Replace this block with your email provider ──────────────
            console.log(`
[ORDER CONFIRMATION EMAIL]
To: ${userEmail}
Subject: Your DropCart Order is Confirmed! 🎉

Hi ${userName},

Thank you for your order! Here's your summary:

${itemList}

Total: ${currency}${orderTotal}
Order ID: ${orderId}

We'll notify you when your order ships.

— The DropCart Team
            `.trim())
            // ──────────────────────────────────────────────────────────────
        })
    }
);

/**
 * Send shipping notification email to buyer.
 * Triggered by: app/order.shipped
 * Data: { orderId, userEmail, userName, storeName }
 */
export const sendOrderShippedEmail = inngest.createFunction(
    { id: 'send-order-shipped-email', triggers: [{ event: 'app/order.shipped' }] },
    async ({ event, step }) => {
        const { orderId, userEmail, userName, storeName } = event.data;

        await step.run('send-shipped-email', async () => {
            // ─── Replace this block with your email provider ──────────────
            console.log(`
[SHIPPING NOTIFICATION EMAIL]
To: ${userEmail}
Subject: Your DropCart Order Has Shipped! 🚚

Hi ${userName},

Great news — your order #${orderId} from ${storeName} has been shipped and is on its way to you.

Check your order status in My Orders on DropCart.

— The DropCart Team
            `.trim())
            // ──────────────────────────────────────────────────────────────
        })
    }
);

/**
 * Notify seller of a new order.
 * Triggered by: app/order.new
 * Data: { storeEmail, storeName, orderId, orderTotal, currency }
 */
export const notifySellerNewOrder = inngest.createFunction(
    { id: 'notify-seller-new-order', triggers: [{ event: 'app/order.new' }] },
    async ({ event, step }) => {
        const { storeEmail, storeName, orderId, orderTotal, currency } = event.data;

        await step.run('send-seller-notification', async () => {
            // ─── Replace this block with your email provider ──────────────
            console.log(`
[NEW ORDER NOTIFICATION — SELLER]
To: ${storeEmail}
Subject: New Order Received on DropCart 🛍️

Hi ${storeName},

You have a new order!

Order ID: ${orderId}
Order Total: ${currency}${orderTotal}

Log in to your seller dashboard to view and process this order.

— The DropCart Team
            `.trim())
            // ──────────────────────────────────────────────────────────────
        })
    }
); 