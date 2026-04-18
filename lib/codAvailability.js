/**
 * COD is unavailable if any line item is shipped from abroad,
 * or is local but the seller disabled COD for that product.
 * Missing `acceptCod` on older records is treated as true (COD allowed for local).
 */
export function cartBlocksCod(products, items) {
  if (!items?.length) return false;
  return items.some((item) => {
    const p = products.find((x) => x.id === item.id);
    if (!p) return false;
    if (p.origin === "ABROAD") return true;
    return p.acceptCod === false;
  });
}
