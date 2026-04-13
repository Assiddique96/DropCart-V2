import prisma from "@/src/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dropcart.ng";

export default async function sitemap() {
  const staticRoutes = [
    { url: BASE_URL,                       lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/shop`,             lastModified: new Date(), changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE_URL}/pricing`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/create-store`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  let productRoutes = [];
  try {
    const products = await prisma.product.findMany({
      where: {
        inStock: true,
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
        store: { isActive: true },
      },
      select: { id: true, updatedAt: true },
      take: 5000,
    });
    productRoutes = products.map(p => ({
      url: `${BASE_URL}/product/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {}

  let storeRoutes = [];
  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: { username: true, updatedAt: true },
      take: 2000,
    });
    storeRoutes = stores.map(s => ({
      url: `${BASE_URL}/shop/${s.username}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {}

  return [...staticRoutes, ...productRoutes, ...storeRoutes];
}
