/*
  Warnings:

  - You are about to drop the `Penalty` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Penalty" DROP CONSTRAINT "Penalty_accountId_fkey";

-- DropTable
DROP TABLE "Penalty";
