-- Enforce at most one PAID payment per order.
-- A partial unique index keeps VOIDED/PENDING retries possible.
-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_paid_key" ON "Payment"("orderId") WHERE "status" = 'PAID';
