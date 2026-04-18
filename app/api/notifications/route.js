import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import { defaultLimiter, looseLimiter } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/sanitize";
import { createNotification } from "@/lib/serverNotifications";

export async function GET(request) {
  const limit = looseLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title: rawTitle, message: rawMessage, type: rawType, link: rawLink } = await request.json();
    const title = sanitizeString(rawTitle, 120);
    const message = sanitizeString(rawMessage, 500);
    const type = sanitizeString(rawType || "system", 30);
    const link = rawLink ? sanitizeString(rawLink, 300) : null;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    const notification = await createNotification({ userId, title, message, type, link });
    if (!notification) {
      return NextResponse.json({ error: "Could not create notification." }, { status: 500 });
    }
    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.notification.deleteMany({ where: { userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
