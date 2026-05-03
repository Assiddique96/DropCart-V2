import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { defaultLimiter, looseLimiter } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/sanitize";
import { writeAuditLog, AUDIT_ACTIONS } from "@/lib/auditLog";
import { clerkClient } from "@clerk/nextjs/server";

// GET /api/admin/users — list all users with stores and order info
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = sanitizeString(searchParams.get("search") || "", 100);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = 20;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          isBanned: true,
          banReason: true,
          createdAt: true,
          stores: { select: { id: true, name: true, username: true, status: true, isActive: true }, orderBy: { createdAt: "desc" } },
          _count: { select: { buyerOrders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/users — ban or unban a user
export async function PATCH(request) {
  try {
    const { userId: adminId } = getAuth(request);
    const isAdmin = await authAdmin(adminId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId, action, reason } = await request.json();

    if (!userId || !["ban", "unban"].includes(action)) {
      return NextResponse.json({ error: "userId and action (ban|unban) required." }, { status: 400 });
    }

    if (userId === adminId) {
      return NextResponse.json({ error: "You cannot ban yourself." }, { status: 400 });
    }

    const cleanReason = sanitizeString(reason || "", 500);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: action === "ban",
        banReason: action === "ban" ? cleanReason || "Banned by admin" : null,
      },
    });

    // Auto-deactivate store if banning
    if (action === "ban") {
      await prisma.store.updateMany({
        where: { userId },
        data: { isActive: false },
      });
    }

    // Audit log
    const client = await clerkClient();
    const adminUser = await client.users.getUser(adminId).catch(() => null);
    await writeAuditLog({
      adminId,
      adminEmail: adminUser?.emailAddresses?.[0]?.emailAddress || "unknown",
      action: action === "ban" ? AUDIT_ACTIONS.BAN_USER : AUDIT_ACTIONS.UNBAN_USER,
      targetType: "User",
      targetId: userId,
      details: { reason: cleanReason || null },
    });

    return NextResponse.json({
      message: `User ${action === "ban" ? "banned" : "unbanned"} successfully.`,
      user: { id: updated.id, isBanned: updated.isBanned },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
