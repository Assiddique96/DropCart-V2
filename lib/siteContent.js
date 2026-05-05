import prisma from "src/db";
import {
  SITE_CATEGORIES_CONFIG_KEY,
  SITE_FAQ_CONFIG_KEY,
  SITE_PRIVACY_CONFIG_KEY,
  SITE_TERMS_CONFIG_KEY,
  SITE_COOKIES_CONFIG_KEY,
  parseStoredCategories,
  parseStoredFaq,
  parseStoredText,
} from "@/lib/siteConfig";

export async function getSiteCategories() {
  const row = await prisma.platformConfig.findUnique({
    where: { key: SITE_CATEGORIES_CONFIG_KEY },
  });
  return parseStoredCategories(row?.value ?? "");
}

export async function getSiteContent() {
  const rows = await prisma.platformConfig.findMany({
    where: {
      key: {
        in: [
          SITE_FAQ_CONFIG_KEY,
          SITE_PRIVACY_CONFIG_KEY,
          SITE_TERMS_CONFIG_KEY,
          SITE_COOKIES_CONFIG_KEY,
        ],
      },
    },
  });

  const config = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return {
    faqItems: parseStoredFaq(config[SITE_FAQ_CONFIG_KEY] ?? ""),
    privacyPolicy: parseStoredText(config[SITE_PRIVACY_CONFIG_KEY] ?? ""),
    termsOfUse: parseStoredText(config[SITE_TERMS_CONFIG_KEY] ?? ""),
    cookiesPolicy: parseStoredText(config[SITE_COOKIES_CONFIG_KEY] ?? ""),
  };
}
