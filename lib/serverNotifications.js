import prisma from "@/src/db";

const MAX_PER_USER = 100;

export async function createNotification({ userId, title, message, type = "system", link = null }) {
    if (!userId || !title || !message) return null;

    const notification = await prisma.notification.create({
        data: { userId, title, message, type, link },
    });

    await trimNotificationsForUser(userId);
    return notification;
}

export async function createNotifications(entries) {
    if (!Array.isArray(entries) || entries.length === 0) return [];

    const valid = entries.filter((entry) => entry?.userId && entry?.title && entry?.message);
    if (valid.length === 0) return [];

    const created = [];
    for (const entry of valid) {
        try {
            const n = await prisma.notification.create({
                data: {
                    userId: entry.userId,
                    title: entry.title,
                    message: entry.message,
                    type: entry.type || "system",
                    link: entry.link ?? null,
                },
            });
            created.push(n);
        } catch (err) {
            console.error("serverNotifications: skipped one notification", err?.message || err);
        }
    }

    const touchedUserIds = [...new Set(created.map((n) => n.userId))];
    await Promise.all(touchedUserIds.map((userId) => trimNotificationsForUser(userId)));

    return created;
}

async function trimNotificationsForUser(userId) {
    const stale = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: MAX_PER_USER,
        select: { id: true },
    });

    if (stale.length > 0) {
        await prisma.notification.deleteMany({
            where: { id: { in: stale.map((item) => item.id) } },
        });
    }
}
