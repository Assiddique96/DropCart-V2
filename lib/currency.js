/**
 * lib/currency.js
 * Central currency helpers used by all payment providers and the UI.
 *
 * Environment variables:
 *   NEXT_PUBLIC_CURRENCY_SYMBOL   — display symbol (e.g. ₦, $, £)
 *   NEXT_PUBLIC_CURRENCY_CODE     — ISO 4217 code (e.g. NGN, USD, GBP)
 *   NEXT_PUBLIC_CURRENCY_SUBUNIT  — smallest unit multiplier (100 for most; 1 for JPY)
 */

export const CURRENCY_SYMBOL  = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL  || '₦';
export const CURRENCY_CODE    = (process.env.NEXT_PUBLIC_CURRENCY_CODE   || 'NGN').toUpperCase();
export const CURRENCY_SUBUNIT = parseInt(process.env.NEXT_PUBLIC_CURRENCY_SUBUNIT || '100', 10);

/**
 * Convert a decimal amount to the smallest currency unit.
 * e.g.  toSubunit(1500)  → 150000  (NGN kobo)
 *        toSubunit(29.99) → 2999    (USD cents)
 *        toSubunit(500)   → 500     (JPY, subunit = 1)
 */
export function toSubunit(amount) {
    return Math.round(amount * CURRENCY_SUBUNIT);
}

/**
 * Convert smallest unit back to decimal.
 * e.g.  fromSubunit(150000) → 1500
 */
export function fromSubunit(amount) {
    return amount / CURRENCY_SUBUNIT;
}

/**
 * Format a decimal amount for display.
 * e.g.  formatCurrency(1500) → '₦1,500.00'
 */
export function formatCurrency(amount) {
    return `${CURRENCY_SYMBOL}${Number(amount).toLocaleString('en', {
        minimumFractionDigits: CURRENCY_SUBUNIT === 1 ? 0 : 2,
        maximumFractionDigits: CURRENCY_SUBUNIT === 1 ? 0 : 2,
    })}`;
}
