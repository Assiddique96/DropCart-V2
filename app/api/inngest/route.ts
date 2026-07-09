import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import {
  deleteExpiredCoupons,
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderProcessingEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  notifySellerNewOrder,
  notifyAdminAndSellerStoreCreated,
  notifyAdminAndSellerStoreUpdated,
  expireFeaturedAd

} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    sendWelcomeEmail,
    deleteExpiredCoupons,
    sendOrderConfirmationEmail,
    sendOrderProcessingEmail,
    sendOrderShippedEmail,
    sendOrderDeliveredEmail,
    sendOrderCancelledEmail,
    notifySellerNewOrder,
    notifyAdminAndSellerStoreCreated,
    notifyAdminAndSellerStoreUpdated,
    expireFeaturedAd
  ],
});