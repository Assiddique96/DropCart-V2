-- AlterTable
ALTER TABLE "Store" ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
ADD COLUMN "verificationRejectedReason" TEXT;

-- Create an index on verificationStatus for efficient querying
CREATE INDEX "Store_verificationStatus_idx" ON "Store"("verificationStatus");
