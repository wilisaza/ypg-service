/*
  Warnings:

  - Added the required column `currentBalance` to the `LoanDetails` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('FRENCH_SYSTEM', 'VARIABLE_CAPITAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'INTEREST_PAYMENT';
ALTER TYPE "TransactionType" ADD VALUE 'LOAN_PAYMENT';

-- AlterTable
ALTER TABLE "LoanDetails" ADD COLUMN     "currentBalance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "disbursementDate" TIMESTAMP(3),
ADD COLUMN     "loanType" "LoanType" NOT NULL DEFAULT 'FRENCH_SYSTEM',
ADD COLUMN     "maturityDate" TIMESTAMP(3),
ADD COLUMN     "monthlyInterestAmount" DOUBLE PRECISION,
ALTER COLUMN "monthlyPayment" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "loanType" "LoanType";
