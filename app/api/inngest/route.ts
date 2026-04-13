import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import {
  deleteExpiredCoupons,
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  notifySellerNewOrder,
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    deleteExpiredCoupons,
    sendOrderConfirmationEmail,
    sendOrderShippedEmail,
    notifySellerNewOrder,
  ],
});