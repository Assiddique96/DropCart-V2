/**
 * lib/auditLog.js
 * Helper to write immutable audit records for admin actions.
 * Non-fatal — a logging failure must never break the primary operation.
 *
 * Usage:
 *   import { writeAuditLog } from "@/lib/auditLog";
 *   await writeAuditLog({ adminId, adminEmail, action: "BAN_USER", targetType: "User", targetId: userId, details: { reason } });
 */

import prisma from "@/src/db";

/**
 * @param {object} params
 * @param {string} params.adminId      - Clerk user ID of the acting admin
 * @param {string} params.adminEmail   - Email of the acting admin
 * @param {string} params.action       - Snake-case action name e.g. "APPROVE_STORE"
 * @param {string} params.targetType   - Entity type e.g. "User", "Store", "Payout"
 * @param {string} params.targetId     - ID of the affected record
 * @param {object} [params.details]    - Optional metadata object
 */
export async function writeAuditLog({ adminId, adminEmail, action, targetType, targetId, details }) {
    try {
        await prisma.auditLog.create({
            data: {
                adminId,
                adminEmail: adminEmail || "unknown",
                action,
                targetType,
                targetId,
                details: details ?? undefined,
            },
        });
    } catch (err) {
        // Non-fatal — log to console but don't throw
        console.error("[AuditLog] Failed to write audit record:", err.message);
    }
}

/**
 * Common action constants — use these for consistency.
 */
export const AUDIT_ACTIONS = {
    // Store
    APPROVE_STORE:   "APPROVE_STORE",
    REJECT_STORE:    "REJECT_STORE",
    TOGGLE_STORE:    "TOGGLE_STORE",
    // User
    BAN_USER:        "BAN_USER",
    UNBAN_USER:      "UNBAN_USER",
    // Product
    DELETE_PRODUCT:  "DELETE_PRODUCT",
    // Coupon
    CREATE_COUPON:   "CREATE_COUPON",
    DELETE_COUPON:   "DELETE_COUPON",
    // Payout
    RECORD_PAYOUT:   "RECORD_PAYOUT",
    // Refund
    APPROVE_REFUND:  "APPROVE_REFUND",
    REJECT_REFUND:   "REJECT_REFUND",
    MARK_REFUNDED:   "MARK_REFUNDED",
    // Config
    UPDATE_CONFIG:   "UPDATE_CONFIG",
};
