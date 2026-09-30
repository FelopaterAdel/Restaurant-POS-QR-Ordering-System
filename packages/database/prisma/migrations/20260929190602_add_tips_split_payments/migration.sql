-- Tips on orders and payments, and split bills: several PAID payments
-- per order are now allowed. The balance guard moved into the payment
-- transaction (row lock + remaining check).
-- AlterTable
ALTER TABLE "Order" ADD COLUMN "tipAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "tipAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- DropIndex
DROP INDEX "Payment_orderId_paid_key";
