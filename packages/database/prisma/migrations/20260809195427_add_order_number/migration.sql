-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderNumber" SERIAL NOT NULL;

-- Backfill existing orders with human-readable numbers starting at 1001,
-- ordered oldest first so the sequence stays chronological.
WITH numbered AS (
  SELECT id, 1000 + row_number() OVER (ORDER BY "createdAt", id) AS num
  FROM "Order"
)
UPDATE "Order" o
SET "orderNumber" = numbered.num
FROM numbered
WHERE o.id = numbered.id;

-- Advance the sequence past the highest assigned number so new orders
-- continue where existing orders left off (next value = 1001 when empty).
SELECT setval(
  pg_get_serial_sequence('"Order"', 'orderNumber'),
  GREATEST((SELECT COALESCE(MAX("orderNumber"), 1000) FROM "Order"), 1000),
  true
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
