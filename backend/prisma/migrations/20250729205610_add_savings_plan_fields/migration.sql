-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "billingDay" INTEGER,
ADD COLUMN     "endMonth" INTEGER,
ADD COLUMN     "monthlyAmount" DOUBLE PRECISION,
ADD COLUMN     "penaltyAmount" DOUBLE PRECISION,
ADD COLUMN     "planYear" INTEGER,
ADD COLUMN     "startMonth" INTEGER;
