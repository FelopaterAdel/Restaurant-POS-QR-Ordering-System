-- DropIndex
DROP INDEX "Payment_status_idx";

-- CreateIndex
CREATE INDEX "Payment_status_paidAt_idx" ON "Payment"("status", "paidAt");
