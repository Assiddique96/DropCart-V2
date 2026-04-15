/**
 * Effective "paid" for UI and revenue: gateway orders use isPaid;
 * COD is collected at delivery (DB flag and/or DELIVERED status).
 */
export function isOrderConsideredPaid(order) {
  if (!order) return false;
  if (order.isPaid) return true;
  if (order.paymentMethod === "COD" && order.status === "DELIVERED") return true;
  return false;
}
