export default function robots() {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dropcart.ng";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/shop", "/product/", "/pricing", "/contact"],
        disallow: ["/admin/", "/store/", "/orders", "/cart", "/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
