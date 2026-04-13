import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authAdmin from "@/middlewares/authAdmin";
import { looseLimiter } from "@/lib/rateLimit";

// GET /api/admin/audit-log — paginated audit log
export async function GET(request) {
    const limit = looseLimiter.check(request);
    if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const pageSize = 50;
        const action   = searchParams.get("action") || undefined;
        const target   = searchParams.get("targetType") || undefined;

        const where = {
            ...(action ? { action } : {}),
            ...(target ? { targetType: target } : {}),
        };

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.auditLog.count({ where }),
        ]);

        return NextResponse.json({ logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
