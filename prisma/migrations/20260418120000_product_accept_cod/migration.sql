-- AlterTable
ALTER TABLE "Product" ADD COLUMN "acceptCod" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Product" SET "acceptCod" = false WHERE "origin" = 'ABROAD';
