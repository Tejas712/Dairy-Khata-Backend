/*
  Warnings:

  - You are about to drop the column `maxAdmins` on the `subscription_plan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "subscription_plan" DROP COLUMN "maxAdmins",
ADD COLUMN     "maxStaff" INTEGER NOT NULL DEFAULT 1;
