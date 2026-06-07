-- Migration: Add tax_rate to PlatformConfig + wholesale pricing tiers

-- Feature 1: TAX/VAT
-- No schema change needed for PlatformConfig (it's a key-value store).
-- Seed the default tax_rate of 0 (disabled).
INSERT INTO "PlatformConfig" ("key", "value", "updatedAt")
VALUES ('tax_rate', '0', NOW())
ON CONFLICT ("key") DO NOTHING;

-- Feature 2: Wholesale pricing
-- Add isWholesale flag to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isWholesale" BOOLEAN NOT NULL DEFAULT FALSE;

-- Create ProductWholesaleTier table
CREATE TABLE IF NOT EXISTS "ProductWholesaleTier" (
    "id"        TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQty"    INTEGER NOT NULL,
    "maxQty"    INTEGER,
    "price"     DOUBLE PRECISION NOT NULL,
    "position"  INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductWholesaleTier_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductWholesaleTier_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProductWholesaleTier_productId_minQty_idx"
    ON "ProductWholesaleTier"("productId", "minQty");
