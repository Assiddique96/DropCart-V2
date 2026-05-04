import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import StoreProvider from "./StoreProvider";
import ThemeProvider from "@/components/ThemeProvider";
import CookieConsentToast from "@/components/CookieConsentToast";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
  title: {
    default: "Shpinx — Nigeria's Multi-Vendor Marketplace",
    template: "%s — Shpinx",
  },
  description:
    "Shop thousands of products from verified sellers across Nigeria. Fast delivery, secure payments, and the best deals all in one place.",
  keywords: ["ecommerce", "Nigeria", "online shopping", "marketplace", "multi-vendor"],
  openGraph: {
    title: "Shpinx — Nigeria's Multi-Vendor Marketplace",
    description: "Shop thousands of products from verified sellers across Nigeria.",
    type: "website",
    locale: "en_NG",
    siteName: "Shpinx",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shpinx — Nigeria's Multi-Vendor Marketplace",
    description: "Shop thousands of products from verified sellers across Nigeria.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${outfit.className} antialiased bg-white text-slate-900 dark:bg-slate-950 dark:text-white`}>
          <StoreProvider>
            <ThemeProvider>
              <Toaster />
              <CookieConsentToast />
              {children}
            </ThemeProvider>
          </StoreProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
