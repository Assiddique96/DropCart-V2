import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";

/**
 * POST /api/admin/approve-store-verification
 * Approves a store's verification and notifies the seller.
 */
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storeId } = await request.json();
    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Update verification status
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        verificationStatus: "verified",
        verificationRejectedReason: null,
      },
    });

    // Create in-app notification for the seller
    if (store.user?.id) {
      await prisma.notification.create({
        data: {
          userId: store.user.id,
          title: "🎉 Store Verified!",
          message: `Congratulations! Your store "${store.name}" has been verified. You now have a verified badge on Shpinx.`,
          type: "store_verification",
          link: "/store",
        },
      }).catch((e) => console.warn("[approve-verify] notification create failed:", e.message));
    }

    // Send email notification via Resend / NodeMailer if configured
    await sendVerificationEmail({
      to: store.email || store.user?.email,
      storeName: store.name,
      status: "approved",
    }).catch((e) => console.warn("[approve-verify] email failed:", e.message));

    return NextResponse.json({
      message: "Store verification approved. Seller has been notified.",
      store: updatedStore,
    });
  } catch (error) {
    console.error("[approve-store-verification]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Sends a verification status email.
 * Uses Resend if RESEND_API_KEY is configured, otherwise logs to console.
 */
async function sendVerificationEmail({ to, storeName, status, reason }) {
  if (!to) return;

  const subject =
    status === "approved"
      ? `✅ Your store "${storeName}" is now verified on Shpinx`
      : `❌ Your store "${storeName}" verification was rejected`;

  const htmlBody =
    status === "approved"
      ? `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px">
          <h2 style="color:#1e293b;margin-bottom:8px">🎉 Congratulations!</h2>
          <p style="color:#475569">Your store <strong>${storeName}</strong> has been <strong>verified</strong> on Shpinx.</p>
          <p style="color:#475569">You now display a verified badge to buyers, boosting your store's trust and visibility.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/store" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Go to my Dashboard →</a>
          <hr style="margin:32px 0;border-color:#e2e8f0" />
          <p style="color:#94a3b8;font-size:12px">Shpinx — Nigeria's marketplace</p>
        </div>
      `
      : `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fef2f2;border-radius:12px">
          <h2 style="color:#7f1d1d;margin-bottom:8px">Verification Update</h2>
          <p style="color:#ef4444">Your store <strong>${storeName}</strong> verification was <strong>rejected</strong>.</p>
          ${reason ? `<p style="color:#475569"><strong>Reason:</strong> ${reason}</p>` : ""}
          <p style="color:#475569">Please review the requirements and resubmit your documents.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/store/verify" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Resubmit Verification →</a>
          <hr style="margin:32px 0;border-color:#fecaca" />
          <p style="color:#94a3b8;font-size:12px">Shpinx — Nigeria's marketplace</p>
        </div>
      `;

  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
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
    // Dev fallback — log the email
    console.log("[email-notification]", { to, subject, status });
  }
}
