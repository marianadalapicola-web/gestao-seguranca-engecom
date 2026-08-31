-- AlterTable
ALTER TABLE "Sector" ADD COLUMN     "leaderId" TEXT;

-- AddForeignKey
ALTER TABLE "Sector" ADD CONSTRAINT "Sector_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
