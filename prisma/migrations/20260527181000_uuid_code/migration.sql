/*
  Warnings:

  - The primary key for the `company` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `company_subscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `company_subscription_payment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `daily_entry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `subscription_plan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_payment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[companyId,productCode]` on the table `product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,customerCode]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "company_subscription" DROP CONSTRAINT "company_subscription_companyId_fkey";

-- DropForeignKey
ALTER TABLE "company_subscription" DROP CONSTRAINT "company_subscription_planId_fkey";

-- DropForeignKey
ALTER TABLE "company_subscription_payment" DROP CONSTRAINT "company_subscription_payment_companyId_fkey";

-- DropForeignKey
ALTER TABLE "company_subscription_payment" DROP CONSTRAINT "company_subscription_payment_handledById_fkey";

-- DropForeignKey
ALTER TABLE "company_subscription_payment" DROP CONSTRAINT "company_subscription_payment_planId_fkey";

-- DropForeignKey
ALTER TABLE "daily_entry" DROP CONSTRAINT "daily_entry_companyId_fkey";

-- DropForeignKey
ALTER TABLE "daily_entry" DROP CONSTRAINT "daily_entry_productId_fkey";

-- DropForeignKey
ALTER TABLE "daily_entry" DROP CONSTRAINT "daily_entry_userId_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_companyId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_companyId_fkey";

-- DropForeignKey
ALTER TABLE "user_payment" DROP CONSTRAINT "user_payment_companyId_fkey";

-- DropForeignKey
ALTER TABLE "user_payment" DROP CONSTRAINT "user_payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_product" DROP CONSTRAINT "user_product_companyId_fkey";

-- DropForeignKey
ALTER TABLE "user_product" DROP CONSTRAINT "user_product_productId_fkey";

-- DropForeignKey
ALTER TABLE "user_product" DROP CONSTRAINT "user_product_userId_fkey";

-- AlterTable
ALTER TABLE "company" DROP CONSTRAINT "company_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "company_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "company_id_seq";

-- AlterTable
ALTER TABLE "company_subscription" DROP CONSTRAINT "company_subscription_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "companyId" SET DATA TYPE TEXT,
ALTER COLUMN "planId" SET DATA TYPE TEXT,
ADD CONSTRAINT "company_subscription_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "company_subscription_id_seq";

-- AlterTable
ALTER TABLE "company_subscription_payment" DROP CONSTRAINT "company_subscription_payment_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "companyId" SET DATA TYPE TEXT,
ALTER COLUMN "planId" SET DATA TYPE TEXT,
ALTER COLUMN "handledById" SET DATA TYPE TEXT,
ADD CONSTRAINT "company_subscription_payment_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "company_subscription_payment_id_seq";

-- AlterTable
ALTER TABLE "daily_entry" DROP CONSTRAINT "daily_entry_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "companyId" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "productId" SET DATA TYPE TEXT,
ADD CONSTRAINT "daily_entry_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "daily_entry_id_seq";

-- AlterTable
ALTER TABLE "product" DROP CONSTRAINT "product_pkey",
ADD COLUMN     "productCode" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "companyId" SET DATA TYPE TEXT,
ADD CONSTRAINT "product_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "product_id_seq";

-- AlterTable
ALTER TABLE "subscription_plan" DROP CONSTRAINT "subscription_plan_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "subscription_plan_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "subscription_plan_id_seq";

-- AlterTable
ALTER TABLE "user" DROP CONSTRAINT "user_pkey",
ADD COLUMN     "customerCode" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "companyId" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "user_id_seq";

-- AlterTable
ALTER TABLE "user_payment" DROP CONSTRAINT "user_payment_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "companyId" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_payment_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "user_payment_id_seq";

-- AlterTable
ALTER TABLE "user_product" DROP CONSTRAINT "user_product_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "companyId" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "productId" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_product_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "user_product_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "product_companyId_productCode_key" ON "product"("companyId", "productCode");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_companyId_customerCode_key" ON "user"("companyId", "customerCode");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_product" ADD CONSTRAINT "user_product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_product" ADD CONSTRAINT "user_product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_product" ADD CONSTRAINT "user_product_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_entry" ADD CONSTRAINT "daily_entry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_entry" ADD CONSTRAINT "daily_entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_entry" ADD CONSTRAINT "daily_entry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_payment" ADD CONSTRAINT "user_payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_payment" ADD CONSTRAINT "user_payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscription" ADD CONSTRAINT "company_subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscription" ADD CONSTRAINT "company_subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscription_payment" ADD CONSTRAINT "company_subscription_payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscription_payment" ADD CONSTRAINT "company_subscription_payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscription_payment" ADD CONSTRAINT "company_subscription_payment_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
