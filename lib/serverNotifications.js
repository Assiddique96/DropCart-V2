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
    const valid = entries.filter((entry) => entry?.userId && entry?.title && entry?.message);
    if (valid.length === 0) return [];

    await prisma.notification.createMany({
        data: valid.map((entry) => ({
            userId: entry.userId,
            title: entry.title,
            message: entry.message,
            type: entry.type || "system",
            link: entry.link ?? null,
        })),
    });

    await Promise.all(
        [...new Set(valid.map((entry) => entry.userId))].map((userId) => trimNotificationsForUser(userId))
    );

    return prisma.notification.findMany({
        where: {
            OR: valid.map((entry) => ({
                userId: entry.userId,
                title: entry.title,
                message: entry.message,
            })),
        },
        orderBy: { createdAt: "desc" },
        take: valid.length,
    });
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
