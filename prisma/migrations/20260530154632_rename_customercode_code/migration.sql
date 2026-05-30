/*
  Warnings:

  - You are about to drop the column `customerCode` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,code]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "user_companyId_customerCode_key";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "customerCode",
ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_companyId_code_key" ON "user"("companyId", "code");
