-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerPhone" TEXT;

-- CreateTable
CREATE TABLE "LoyaltyAccount" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyPointEntry" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "orderId" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyPointEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyAccount_phone_key" ON "LoyaltyAccount"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyPointEntry_orderId_key" ON "LoyaltyPointEntry"("orderId");

-- CreateIndex
CREATE INDEX "LoyaltyPointEntry_accountId_idx" ON "LoyaltyPointEntry"("accountId");

-- CreateIndex
CREATE INDEX "LoyaltyPointEntry_expiresAt_idx" ON "LoyaltyPointEntry"("expiresAt");

-- AddForeignKey
ALTER TABLE "LoyaltyPointEntry" ADD CONSTRAINT "LoyaltyPointEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LoyaltyAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
