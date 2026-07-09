function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildOrderItemsHtml(items = [], currency = "$") {
  if (!Array.isArray(items) || items.length === 0) return "";

  const htmlItems = items.map((item) => {
    const name = escapeHtml(item?.name || item?.productName || "Item");
    const quantity = Number(item?.quantity ?? 1);
    const price = Number(item?.price ?? 0);
    return `<li><strong>${name}</strong> × ${quantity} — ${currency}${price.toFixed(2)}</li>`;
  });

  return `<ul>${htmlItems.join("")}</ul>`;
}

export function getTrackingUrl(trackingNumber, baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") {
  if (!trackingNumber) return null;
  return `${String(baseUrl).replace(/\/$/, "")}/track?trackingNumber=${encodeURIComponent(trackingNumber)}`;
}
