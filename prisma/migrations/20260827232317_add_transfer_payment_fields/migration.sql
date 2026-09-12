-- AddColumn
ALTER TABLE "transfers" ADD COLUMN "paidAt" TIMESTAMP(3);

-- AddColumn
ALTER TABLE "transfers" ADD COLUMN "paidByAgentId" TEXT;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_paidByAgentId_fkey" FOREIGN KEY ("paidByAgentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
