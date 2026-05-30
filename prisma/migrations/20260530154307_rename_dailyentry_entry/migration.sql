/*
  Warnings:

  - You are about to drop the `daily_entry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "daily_entry" DROP CONSTRAINT "daily_entry_companyId_fkey";

-- DropForeignKey
ALTER TABLE "daily_entry" DROP CONSTRAINT "daily_entry_productId_fkey";

-- DropForeignKey
ALTER TABLE "daily_entry" DROP CONSTRAINT "daily_entry_userId_fkey";

-- DropTable
DROP TABLE "daily_entry";

-- CreateTable
CREATE TABLE "entry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "entryDate" DATE NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "entry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "entry" ADD CONSTRAINT "entry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry" ADD CONSTRAINT "entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry" ADD CONSTRAINT "entry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
