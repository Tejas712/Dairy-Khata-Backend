-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('SALE', 'PURCHASE');

-- AlterTable
ALTER TABLE "entry" ADD COLUMN     "type" "EntryType" NOT NULL DEFAULT 'SALE';
