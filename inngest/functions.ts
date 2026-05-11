import { inngest } from "./client";
import {prisma} from "../src/db"
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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



/**
 * Send order confirmation email to buyer.
 */
export const sendOrderConfirmationEmail = inngest.createFunction(
  { id: 'send-order-confirmation-email', triggers: [{ event: 'app/order.confirmed' }] },
  async ({ event, step }) => {
    const { orderId, userEmail, userName, orderTotal, currency, items } = event.data;

    await step.run('send-confirmation-email', async () => {
      const itemListHtml = items.map(i => `<li>${i.name} × ${i.quantity} — ${currency}${i.price}</li>`).join('');

      const { data, error } = await resend.emails.send({
        from: 'Shpinx <support.shpinx.com>', // Replace with your verified domain
        to: [userEmail],
        subject: 'Your Shpinx Order is Confirmed! 🎉',
        html: `
          <h1>Hi ${userName},</h1>
          <p>Thank you for your order! Here's your summary:</p>
          <ul>${itemListHtml}</ul>
          <p><strong>Total: ${currency}${orderTotal}</strong></p>
          <p>Order ID: ${orderId}</p>
          <p>We'll notify you when your order ships.</p>
          <p>— The Shpinx Team</p>
        `,
      });

      if (error) throw new Error(error.message);
      return data;
    });
  }
);

/**
 * Send shipping notification email to buyer.
 */
export const sendOrderShippedEmail = inngest.createFunction(
  { id: 'send-order-shipped-email', triggers: [{ event: 'app/order.shipped' }] },
  async ({ event, step }) => {
    const { orderId, userEmail, userName, storeName } = event.data;

    await step.run('send-shipped-email', async () => {
      const { data, error } = await resend.emails.send({
        from: 'Shpinx <support.shpinx.com>',
        to: [userEmail],
        subject: 'Your Shpinx Order Has Shipped! 🚚',
        html: `
          <p>Hi ${userName},</p>
          <p>Great news — your order <strong>#${orderId}</strong> from ${storeName} has been shipped and is on its way to you.</p>
          <p>Check your order status in My Orders on Shpinx.</p>
          <p>— The Shpinx Team</p>
        `,
      });

      if (error) throw new Error(error.message);
      return data;
    });
  }
);

/**
 * Notify seller of a new order.
 */
export const notifySellerNewOrder = inngest.createFunction(
  { id: 'notify-seller-new-order', triggers: [{ event: 'app/order.new' }] },
  async ({ event, step }) => {
    const { storeEmail, storeName, orderId, orderTotal, currency } = event.data;

    await step.run('send-seller-notification', async () => {
      const { data, error } = await resend.emails.send({
        from: 'Shpinx Alerts <support.shpinx.com>',
        to: [storeEmail],
        subject: 'New Order Received on Shpinx 🛍️',
        html: `
          <p>Hi ${storeName},</p>
          <p>You have a new order!</p>
          <p><strong>Order ID:</strong> ${orderId}<br />
          <strong>Order Total:</strong> ${currency}${orderTotal}</p>
          <p>Log in to your seller dashboard to view and process this order.</p>
          <p>— The Shpinx Team</p>
        `,
      });

      if (error) throw new Error(error.message);
      return data;
    });
  }
);