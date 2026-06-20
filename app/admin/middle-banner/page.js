import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const {
        title,
        subtitle,
        imageUrl,
        linkUrl,
        ctaText,
        position,
        isActive,
        countryCode,
        startsAt,
        endsAt,
      } = req.body;

      if (!title || !imageUrl) {
        return res.status(400).json({ message: "Title and imageUrl are required" });
      }

      const banner = await prisma.middleBanner.create({
        data: {
          title,
          subtitle: subtitle || null,
          imageUrl,
          linkUrl: linkUrl || null,
          ctaText: ctaText || null,
          position: Number(position || 0),
          isActive: Boolean(isActive ?? true),
          countryCode: countryCode || null,
          startsAt: startsAt ? new Date(startsAt) : null,
          endsAt: endsAt ? new Date(endsAt) : null,
        },
      });

      return res.status(201).json({ banner });
    } catch (error) {
      console.error("POST /api/admin/middle-banners error:", error);
      return res.status(500).json({ message: "Failed to create banner" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { id, ...data } = req.body;
      if (!id) return res.status(400).json({ message: "id is required" });

      const banner = await prisma.middleBanner.update({
        where: { id },
        data: {
          title: data.title,
          subtitle: data.subtitle || null,
          imageUrl: data.imageUrl,
          linkUrl: data.linkUrl || null,
          ctaText: data.ctaText || null,
          position: data.position !== undefined ? Number(data.position) : undefined,
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
          countryCode: data.countryCode || null,
          startsAt: data.startsAt ? new Date(data.startsAt) : null,
          endsAt: data.endsAt ? new Date(data.endsAt) : null,
        },
      });

      return res.status(200).json({ banner });
    } catch (error) {
      console.error("PUT /api/admin/middle-banners error:", error);
      return res.status(500).json({ message: "Failed to update banner" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ message: "id is required" });

      await prisma.middleBanner.delete({ where: { id } });
      return res.status(200).json({ message: "Banner deleted" });
    } catch (error) {
      console.error("DELETE /api/admin/middle-banners error:", error);
      return res.status(500).json({ message: "Failed to delete banner" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
