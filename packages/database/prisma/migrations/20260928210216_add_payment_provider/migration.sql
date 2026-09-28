-- Track the online payment provider (e.g. stripe) and its payment reference.
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "provider" TEXT,
ADD COLUMN "providerRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");
