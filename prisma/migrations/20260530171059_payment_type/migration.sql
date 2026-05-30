-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH_IN', 'CASH_OUT');

-- AlterTable
ALTER TABLE "user_payment" ADD COLUMN     "type" "PaymentType" NOT NULL DEFAULT 'CASH_IN';
