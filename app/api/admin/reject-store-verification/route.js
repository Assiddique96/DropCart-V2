import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { sanitizeString } from "@/lib/sanitize";

/**
 * POST /api/admin/reject-store-verification
 * Rejects a store's verification and notifies the seller with the reason.
 */
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storeId, reason } = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }
    if (!reason?.trim()) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const cleanReason = sanitizeString(reason, 500);

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        verificationStatus: "rejected",
        verificationRejectedReason: cleanReason,
      },
    });

    // In-app notification
    if (store.user?.id) {
      await prisma.notification.create({
        data: {
          userId: store.user.id,
          title: "Store Verification Update",
          message: `Your store "${store.name}" verification was not approved. Reason: ${cleanReason}. Please review and resubmit.`,
          type: "store_verification",
          link: "/store/verify",
        },
      }).catch((e) => console.warn("[reject-verify] notification failed:", e.message));
    }

    // Email notification
    await sendRejectionEmail({
      to: store.email || store.user?.email,
      storeName: store.name,
      reason: cleanReason,
    }).catch((e) => console.warn("[reject-verify] email failed:", e.message));

    return NextResponse.json({
      message: "Store verification rejected. Seller has been notified.",
      store: updatedStore,
    });
  } catch (error) {
    console.error("[reject-store-verification]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function sendRejectionEmail({ to, storeName, reason }) {
  if (!to) return;

  const subject = `Your store "${storeName}" verification was rejected`;
  const htmlBody = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fef2f2;border-radius:12px">
      <h2 style="color:#7f1d1d;margin-bottom:8px">Verification Not Approved</h2>
      <p style="color:#475569">Your store <strong>${storeName}</strong> verification could not be approved at this time.</p>
      ${reason ? `<div style="background:#fee2e2;border-radius:8px;padding:12px;margin:16px 0"><p style="margin:0;color:#991b1b;font-size:14px"><strong>Reason:</strong> ${reason}</p></div>` : ""}
      <p style="color:#475569">Please address the issue and resubmit your verification documents.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/store/verify" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Resubmit Verification →</a>
      <hr style="margin:32px 0;border-color:#fecaca" />
      <p style="color:#94a3b8;font-size:12px">Shpinx — Nigeria's marketplace</p>
    </div>
  `;

  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Shpinx <noreply@shpinx.com>",
        to: [to],
        subject,
        html: htmlBody,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? "Resend API error");
    }
  } else {
    console.log("[email-notification]", { to, subject, status: "rejected", reason });
  }
}
