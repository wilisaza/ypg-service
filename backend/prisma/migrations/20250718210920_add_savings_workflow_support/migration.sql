/*
  Warnings:

  - You are about to drop the column `month` on the `ProductAccount` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `ProductAccount` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CUOTAS_FIJAS', 'ABONOS_LIBRES');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('CUOTA_AHORRO', 'MULTA', 'PAGO', 'INTERES', 'GENERAL');

-- AlterTable
ALTER TABLE "FinancialProduct" ADD COLUMN     "defaultInterest" DOUBLE PRECISION,
ADD COLUMN     "endMonth" INTEGER,
ADD COLUMN     "endYear" INTEGER,
ADD COLUMN     "graceDays" INTEGER DEFAULT 5,
ADD COLUMN     "monthlyAmount" DOUBLE PRECISION,
ADD COLUMN     "paymentMode" "PaymentMode",
ADD COLUMN     "penaltyAmount" DOUBLE PRECISION,
ADD COLUMN     "startMonth" INTEGER,
ADD COLUMN     "startYear" INTEGER,
ADD COLUMN     "termMonths" INTEGER;

-- AlterTable
ALTER TABLE "ProductAccount" DROP COLUMN "month",
DROP COLUMN "year",
ADD COLUMN     "lastInterestDate" TIMESTAMP(3),
ADD COLUMN     "outstandingBalance" DOUBLE PRECISION,
ADD COLUMN     "paymentMode" "PaymentMode";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "month" INTEGER,
ADD COLUMN     "relatedTransactionId" UUID,
ADD COLUMN     "year" INTEGER;

-- AlterTable
ALTER TABLE "TransactionTypeDetail" ADD COLUMN     "category" "TransactionCategory" NOT NULL DEFAULT 'GENERAL';

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_relatedTransactionId_fkey" FOREIGN KEY ("relatedTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
