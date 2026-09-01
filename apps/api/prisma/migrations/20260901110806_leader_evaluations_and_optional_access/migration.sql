-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasSystemAccess" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LeaderEvaluation" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadershipScore" INTEGER NOT NULL,
    "communicationScore" INTEGER NOT NULL,
    "safetyCommitmentScore" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaderEvaluation_leaderId_idx" ON "LeaderEvaluation"("leaderId");

-- CreateIndex
CREATE INDEX "LeaderEvaluation_date_idx" ON "LeaderEvaluation"("date");

-- AddForeignKey
ALTER TABLE "LeaderEvaluation" ADD CONSTRAINT "LeaderEvaluation_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderEvaluation" ADD CONSTRAINT "LeaderEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
