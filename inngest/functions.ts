import { inngest } from "./client";
import { prisma } from "../src/db";
import { resend } from "@/lib/resend";
import { formatOrderReference } from "@/lib/orderReference";
import { buildOrderItemsHtml, getTrackingUrl } from "@/lib/orderEmail";

async function sendResendEmail(options: Parameters<typeof resend.emails.send>[0]) {
  try {
    return await resend.emails.send(options);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Resend email failed: ${message}`);
  }
}

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

function getAdminEmails() {
    const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
    return raw
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);
}

function formatDisplayName(rawName) {
    if (!rawName) return "there";
    const trimmed = rawName.trim();
    if (!trimmed) return "there";
    return trimmed.split(" ")[0];
}

export const sendWelcomeEmail = inngest.createFunction(
    {
        id: 'send-welcome-email',
        triggers: [{ event: 'clerk/user.created' }],
    },
    async ({ event, step }) => {
        const { data } = event;
        const userEmail = data.email_addresses?.[0]?.email_address;
        const userFirstName = formatDisplayName(data.first_name || data.last_name || data.name);
        if (!userEmail) return;

        await step.run('send-welcome-email', async () => {
            const data = await sendResendEmail({
                from: 'Shpinx <welcome@shpinx.com>',
                to: [userEmail],
                subject: 'Welcome to Shpinx! Your account is ready',
                html: `
                    <h1>Welcome, ${userFirstName}!</h1>
                    <p>Thanks for joining Shpinx. Your account is now set up and ready to use.</p>
                    <p>Start shopping, sell with your new store, and enjoy seamless order tracking.</p>
                    <p>If you need help, reply to this email and our support team will be happy to help.</p>
                    <p>— The Shpinx Team</p>
                `,
            });

            return data;
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
 * Remove a featured/sponsored product from the home page once its paid
 * duration (AdRequest.durationDays, priced via ad_price_per_day) ends.
 * Triggered by: app/ad.approved  Data: { adRequestId, productId, endsAt }
 */
export const expireFeaturedAd = inngest.createFunction(
    {
        id: 'expire-featured-ad',
        triggers: [{ event: 'app/ad.approved' }]
    },
    async ({ event, step }) => {
        const { data } = event;
        const endsAt = new Date(data.endsAt);
        await step.sleepUntil('wait-for-ad-expiry', endsAt);

        await step.run('remove-ad-from-homepage', async () => {
            // Only remove if the request is still APPROVED (admin may have
            // since rejected/replaced it, or a newer request may exist).
            const current = await prisma.adRequest.findUnique({ where: { id: data.adRequestId } });
            if (!current || current.status !== 'APPROVED') return;

            const homePageContent = await prisma.platformConfig.findUnique({
                where: { key: 'home_page_content' },
            });
            if (!homePageContent?.value) return;

            let content;
            try {
                content = JSON.parse(homePageContent.value);
            } catch {
                return;
            }

            content.featured = (content.featured || []).filter(
                (slide) => slide.href !== `/product/${data.productId}`
            );

            await prisma.platformConfig.update({
                where: { key: 'home_page_content' },
                data: { value: JSON.stringify(content) },
            });
        });
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
    const { orderId, orderIds, userEmail, userName, orderTotal, currency, items } = event.data;

    await step.run('send-confirmation-email', async () => {
      const referenceCode = orderId || formatOrderReference(orderIds?.[0] ?? orderIds ?? '');
      const itemListHtml = buildOrderItemsHtml(items, currency);

      const data = await sendResendEmail({
        from: 'Shpinx <orders@shpinx.com>',
        to: [userEmail],
        subject: 'Your Shpinx Order is Confirmed! 🎉',
        html: `
          <h1>Hi ${userName},</h1>
          <p>Thank you for your order! Your order has been confirmed and the items below are now being prepared.</p>
          <p><strong>Order Ref:</strong> ${referenceCode}</p>
          ${itemListHtml}
          <p><strong>Total:</strong> ${currency}${orderTotal}</p>
          <p>We'll notify you when your order starts processing and again when it ships.</p>
          <p>— The Shpinx Team</p>
        `,
      });

      return data;
    });
  }
);

/**
 * Send shipping notification email to buyer.
 */
function buildOrderStatusEmailHtml({ userName, referenceCode, storeName, items, currency, orderTotal, trackingNumber, message, ctaText, footer }: { userName: string; referenceCode: string; storeName?: string; items?: Array<{ name?: string; quantity?: number; price?: number }>; currency?: string; orderTotal?: number | string; trackingNumber?: string; message: string; ctaText: string; footer?: string; }) {
  const itemListHtml = buildOrderItemsHtml(items, currency);
  const trackingLink = getTrackingUrl(trackingNumber);

  return `
    <h1>Hi ${userName},</h1>
    <p>${message}</p>
    <p><strong>Order Ref:</strong> ${referenceCode}</p>
    ${storeName ? `<p><strong>Store:</strong> ${storeName}</p>` : ""}
    ${itemListHtml}
    <p><strong>Total:</strong> ${currency}${orderTotal}</p>
    ${trackingLink ? `<p><strong>Track your order:</strong> <a href="${trackingLink}">${trackingLink}</a></p>` : ""}
    <p>${ctaText}</p>
    <p>— The Shpinx Team</p>
    ${footer ? `<p>${footer}</p>` : ""}
  `;
}

export const sendOrderProcessingEmail = inngest.createFunction(
  { id: 'send-order-processing-email', triggers: [{ event: 'app/order.processing' }] },
  async ({ event, step }) => {
    const { orderId, userEmail, userName, storeName, orderTotal, currency, items } = event.data;

    await step.run('send-processing-email', async () => {
      const referenceCode = orderId || 'N/A';
      const data = await sendResendEmail({
        from: 'Shpinx <orders@shpinx.com>',
        to: [userEmail],
        subject: 'Your Shpinx Order Is Being Processed 🛍️',
        html: buildOrderStatusEmailHtml({
          userName,
          referenceCode,
          storeName,
          items,
          currency,
          orderTotal,
          message: 'Your order is now being prepared by the seller and will be shipped soon.',
          ctaText: 'We will update you again once your order has been shipped.',
        }),
      });

      return data;
    });
  }
);

export const sendOrderShippedEmail = inngest.createFunction(
  { id: 'send-order-shipped-email', triggers: [{ event: 'app/order.shipped' }] },
  async ({ event, step }) => {
    const { orderId, userEmail, userName, storeName, orderTotal, currency, items, trackingNumber } = event.data;

    await step.run('send-shipped-email', async () => {
      const referenceCode = orderId || 'N/A';
      const data = await sendResendEmail({
        from: 'Shpinx <orders@shpinx.com>',
        to: [userEmail],
        subject: 'Your Shpinx Order Has Shipped! 🚚',
        html: buildOrderStatusEmailHtml({
          userName,
          referenceCode,
          storeName,
          items,
          currency,
          orderTotal,
          trackingNumber,
          message: 'Great news — your order has shipped and is on its way to you.',
          ctaText: 'Track your parcel using the link below.',
        }),
      });

      return data;
    });
  }
);

export const sendOrderDeliveredEmail = inngest.createFunction(
  { id: 'send-order-delivered-email', triggers: [{ event: 'app/order.delivered' }] },
  async ({ event, step }) => {
    const { orderId, userEmail, userName, storeName, orderTotal, currency, items } = event.data;

    await step.run('send-delivered-email', async () => {
      const referenceCode = orderId || 'N/A';
      const data = await sendResendEmail({
        from: 'Shpinx <orders@shpinx.com>',
        to: [userEmail],
        subject: 'Your Shpinx Order Has Been Delivered 📦',
        html: buildOrderStatusEmailHtml({
          userName,
          referenceCode,
          storeName,
          items,
          currency,
          orderTotal,
          message: 'Your order has been delivered. We hope you are enjoying it.',
          ctaText: 'Please take a moment to rate the product and the store to help other shoppers.',
          footer: 'Thanks for shopping with Shpinx.',
        }),
      });

      return data;
    });
  }
);

export const sendOrderCancelledEmail = inngest.createFunction(
  { id: 'send-order-cancelled-email', triggers: [{ event: 'app/order.cancelled' }] },
  async ({ event, step }) => {
    const { orderId, userEmail, userName, storeName, orderTotal, currency, items, reason } = event.data;

    await step.run('send-cancelled-email', async () => {
      const referenceCode = orderId || 'N/A';
      const data = await sendResendEmail({
        from: 'Shpinx <orders@shpinx.com>',
        to: [userEmail],
        subject: 'Your Shpinx Order Was Cancelled',
        html: buildOrderStatusEmailHtml({
          userName,
          referenceCode,
          storeName,
          items,
          currency,
          orderTotal,
          message: reason ? `Your order was cancelled. Reason: ${reason}` : 'Your order was cancelled.',
          ctaText: 'If this was a mistake, you can contact the store or support for help.',
        }),
      });

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
    const { storeEmail, storeName, orderId, orderTotal, currency, items = [] } = event.data;

    await step.run('send-seller-notification', async () => {
      const itemListHtml = buildOrderItemsHtml(items, currency);
      const data = await sendResendEmail({
        from: 'Shpinx Alerts <system@shpinx.com>',
        to: [storeEmail],
        subject: 'New Order Received on Shpinx 🛍️',
        html: `
          <p>Hi ${storeName},</p>
          <p>You have a new order!</p>
          <p><strong>Order Ref:</strong> ${orderId}<br />
          <strong>Order Total:</strong> ${currency}${orderTotal}</p>
          ${itemListHtml}
          <p>Log in to your seller dashboard to view and process this order.</p>
          <p>— The Shpinx Team</p>
        `,
      });

      return data;
    });
  }
);

export const notifyAdminAndSellerStoreCreated = inngest.createFunction(
  { id: 'notify-admin-seller-store-created', triggers: [{ event: 'app/store.created' }] },
  async ({ event, step }) => {
    const { storeName, storeEmail, storeUsername, status } = event.data;
    const adminEmails = getAdminEmails();

    await step.run('send-new-store-to-admin', async () => {
      if (adminEmails.length === 0) return null;
      const data = await sendResendEmail({
        from: 'Shpinx Alerts <system@shpinx.com>',
        to: adminEmails,
        subject: `New store application: ${storeName}`,
        html: `
          <h1>New Store Application</h1>
          <p><strong>Store:</strong> ${storeName}</p>
          <p><strong>Username:</strong> ${storeUsername || 'N/A'}</p>
          <p><strong>Status:</strong> ${status || 'pending'}</p>
          <p>Please review the new store application in the admin dashboard.</p>
          <p>— The Shpinx Team</p>
        `,
      });
      return data;
    });

    await step.run('send-new-store-to-seller', async () => {
      const data = await sendResendEmail({
        from: 'Shpinx <welcome@shpinx.com>',
        to: [storeEmail],
        subject: 'Store application received',
        html: `
          <h1>Your store application is received</h1>
          <p>Thanks for submitting ${storeName} to Shpinx.</p>
          <p>We have received your application and will review it shortly.</p>
          <p>You will receive another email when your store is approved.</p>
          <p>— The Shpinx Team</p>
        `,
      });
      return data;
    });
  }
);

export const notifyAdminAndSellerStoreUpdated = inngest.createFunction(
  { id: 'notify-admin-seller-store-updated', triggers: [{ event: 'app/store.updated' }] },
  async ({ event, step }) => {
    const { storeName, storeEmail, storeUsername, status } = event.data;
    const adminEmails = getAdminEmails();

    await step.run('send-updated-store-to-admin', async () => {
      if (adminEmails.length === 0) return null;
      const data = await sendResendEmail({
        from: 'Shpinx Alerts <system@shpinx.com>',
        to: adminEmails,
        subject: `Store updated: ${storeName}`,
        html: `
          <h1>Store Updated</h1>
          <p><strong>Store:</strong> ${storeName}</p>
          <p><strong>Username:</strong> ${storeUsername || 'N/A'}</p>
          <p><strong>Status:</strong> ${status || 'pending'}</p>
          <p>Please review the updated store data in the admin dashboard.</p>
          <p>— The Shpinx Team</p>
        `,
      });
      return data;
    });

    await step.run('send-updated-store-to-seller', async () => {
      const data = await sendResendEmail({
        from: 'Shpinx <welcome@shpinx.com>',
        to: [storeEmail],
        subject: 'Your store profile was updated',
        html: `
          <h1>Your store profile was updated</h1>
          <p>Your store <strong>${storeName}</strong> has been updated successfully.</p>
          <p>We will review the changes and let you know if anything else is required.</p>
          <p>— The Shpinx Team</p>
        `,
      });
      return data;
    });
  }
);