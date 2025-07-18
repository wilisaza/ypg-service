/*
  Warnings:

  - You are about to drop the column `type` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `typeId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "type",
ADD COLUMN     "typeId" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "TransactionType";

-- CreateTable
CREATE TABLE "TransactionTypeDetail" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nature" TEXT NOT NULL,

    CONSTRAINT "TransactionTypeDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionTypeDetail_name_key" ON "TransactionTypeDetail"("name");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "TransactionTypeDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
