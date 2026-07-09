import prisma from "@/src/db";
import StoreShopPageClient from "@/components/public/StoreShopPageClient";

export async function generateMetadata({ params }) {
  const { username } = await params;

  try {
    const store = await prisma.store.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        username: true,
        isActive: true,
      },
    });

    if (!store || !store.isActive) {
      return {
        title: "Store not found",
        description: "This store could not be found or is not live yet.",
      };
    }

    const description = store.description?.replace(/<[^>]+>/g, "").slice(0, 160) || `Shop products from ${store.name} on Shpinx.`;

    return {
      title: `${store.name} | Shpinx`,
      description,
      alternates: { canonical: `/shop/${store.username}` },
      openGraph: {
        title: store.name,
        description,
        type: "website",
        url: `/shop/${store.username}`,
        images: store.logo ? [{ url: store.logo, alt: store.name }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: store.name,
        description,
        images: store.logo ? [store.logo] : undefined,
      },
    };
  } catch (error) {
    console.error("Failed to generate store metadata", error);
    return {
      title: "Store",
      description: "Discover stores on Shpinx",
    };
  }
}

export default async function StoreShopPage() {
  return <StoreShopPageClient />;
}
