/*
  Warnings:

  - Added the required column `createdById` to the `Indicator` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Indicator" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Indicator" ADD CONSTRAINT "Indicator_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
