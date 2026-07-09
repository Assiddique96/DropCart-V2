import prisma from "@/src/db";
import ProductPageClient from "@/components/public/ProductPageClient";

export async function generateMetadata({ params }) {
  const { productId } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        inStock: true,
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
      },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        price: true,
        category: true,
        store: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    });

    if (!product || !product.store) {
      return {
        title: "Product not found",
        description: "The requested product could not be found.",
      };
    }

    const image = product.images?.[0] || "";
    const description = product.description?.replace(/<[^>]+>/g, "").slice(0, 160) || "Shop this product on Shpinx";

    return {
      title: `${product.name} | Shpinx`,
      description,
      alternates: { canonical: `/product/${product.id}` },
      openGraph: {
        title: product.name,
        description,
        type: "product",
        url: `/product/${product.id}`,
        images: image ? [{ url: image, alt: product.name }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch (error) {
    console.error("Failed to generate product metadata", error);
    return {
      title: "Product",
      description: "Discover products on Shpinx",
    };
  }
}

export default async function ProductPage({ params }) {
  const { productId } = await params;
  return <ProductPageClient productId={productId} />;
}
