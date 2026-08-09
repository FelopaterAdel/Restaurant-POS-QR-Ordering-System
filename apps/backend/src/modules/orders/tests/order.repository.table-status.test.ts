import { OrderStatus, Prisma, TableStatus, prisma } from "@restaurant/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OrderRepository } from "../repositories/order.repository.js";

const dbAvailable = await checkDatabaseAvailable();

async function checkDatabaseAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

const RUN_ID = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
const TABLE_NUMBER_BASE = Math.floor(Math.random() * 90_000) + 10_000;

const repository = new OrderRepository();

let categoryId: string;
let productId: string;
const createdTableIds: string[] = [];
const createdOrderIds: string[] = [];

describe.skipIf(!dbAvailable)(
  "Order repository table status lifecycle",
  () => {
    beforeAll(async () => {
      if (!dbAvailable) {
        return;
      }

      const category = await prisma.category.create({
        data: { name: `TableLifecycle ${RUN_ID}` },
      });
      categoryId = category.id;

      const product = await prisma.product.create({
        data: {
          categoryId,
          name: `LifecycleProduct ${RUN_ID}`,
          price: new Prisma.Decimal(50),
        },
      });
      productId = product.id;
    });

    afterAll(async () => {
      if (!dbAvailable) {
        return;
      }

      await prisma.order.deleteMany({
        where: { id: { in: createdOrderIds } },
      });
      await prisma.restaurantTable.deleteMany({
        where: { id: { in: createdTableIds } },
      });
      await prisma.product.delete({ where: { id: productId } });
      await prisma.category.delete({ where: { id: categoryId } });
    });

    async function createTable(): Promise<{ id: string }> {
      const table = await prisma.restaurantTable.create({
        data: {
          number: TABLE_NUMBER_BASE + createdTableIds.length,
          name: `Tbl ${RUN_ID}`,
          qrCode: `tbl_${RUN_ID}_${createdTableIds.length}`,
        },
      });
      createdTableIds.push(table.id);
      return table;
    }

    async function createOrder(tableId: string) {
      const order = await repository.createWithItems({
        tableId,
        totalAmount: new Prisma.Decimal(100),
        items: [
          {
            productId,
            quantity: 2,
            unitPrice: new Prisma.Decimal(50),
            totalPrice: new Prisma.Decimal(100),
          },
        ],
      });
      createdOrderIds.push(order.id);
      return order;
    }

    it("marks the table as OCCUPIED when an order is created", async () => {
      const table = await createTable();

      await createOrder(table.id);

      const fresh = await prisma.restaurantTable.findUnique({
        where: { id: table.id },
      });
      expect(fresh?.status).toBe(TableStatus.OCCUPIED);
    });

    it("rolls back the table status when order creation fails", async () => {
      const table = await createTable();

      await expect(
        repository.createWithItems({
          tableId: table.id,
          totalAmount: new Prisma.Decimal(10),
          items: [
            {
              productId: "missing_product",
              quantity: 1,
              unitPrice: new Prisma.Decimal(10),
              totalPrice: new Prisma.Decimal(10),
            },
          ],
        }),
      ).rejects.toThrow();

      const fresh = await prisma.restaurantTable.findUnique({
        where: { id: table.id },
      });
      expect(fresh?.status).toBe(TableStatus.AVAILABLE);
      const orderCount = await prisma.order.count({
        where: { tableId: table.id },
      });
      expect(orderCount).toBe(0);
    });

    it("keeps the table OCCUPIED when completing one of two active orders", async () => {
      const table = await createTable();
      const first = await createOrder(table.id);
      await createOrder(table.id);

      await repository.completeOrderAndReleaseTable({
        orderId: first.id,
        tableId: table.id,
      });

      const fresh = await prisma.restaurantTable.findUnique({
        where: { id: table.id },
      });
      expect(fresh?.status).toBe(TableStatus.OCCUPIED);
    });

    it("sets the table AVAILABLE when the last active order is completed", async () => {
      const table = await createTable();
      const first = await createOrder(table.id);
      const second = await createOrder(table.id);

      await repository.completeOrderAndReleaseTable({
        orderId: first.id,
        tableId: table.id,
      });
      await repository.completeOrderAndReleaseTable({
        orderId: second.id,
        tableId: table.id,
      });

      const fresh = await prisma.restaurantTable.findUnique({
        where: { id: table.id },
      });
      expect(fresh?.status).toBe(TableStatus.AVAILABLE);
    });

    it("keeps the table OCCUPIED when cancelling one of two active orders", async () => {
      const table = await createTable();
      const first = await createOrder(table.id);
      await createOrder(table.id);

      await repository.cancelOrderAndReleaseTableIfUnoccupied({
        orderId: first.id,
        cancelledReason: null,
      });

      const fresh = await prisma.restaurantTable.findUnique({
        where: { id: table.id },
      });
      expect(fresh?.status).toBe(TableStatus.OCCUPIED);
    });

    it("sets the table AVAILABLE when the last active order is cancelled", async () => {
      const table = await createTable();
      const first = await createOrder(table.id);
      const second = await createOrder(table.id);

      await repository.cancelOrderAndReleaseTableIfUnoccupied({
        orderId: first.id,
        cancelledReason: null,
      });
      await repository.cancelOrderAndReleaseTableIfUnoccupied({
        orderId: second.id,
        cancelledReason: null,
      });

      const fresh = await prisma.restaurantTable.findUnique({
        where: { id: table.id },
      });
      expect(fresh?.status).toBe(TableStatus.AVAILABLE);
    });

    it("keeps the table OCCUPIED across mixed terminal states", async () => {
      const table = await createTable();
      const first = await createOrder(table.id);
      const second = await createOrder(table.id);
      const third = await createOrder(table.id);

      await repository.completeOrderAndReleaseTable({
        orderId: first.id,
        tableId: table.id,
      });
      await repository.cancelOrderAndReleaseTableIfUnoccupied({
        orderId: second.id,
        cancelledReason: null,
      });

      let fresh = await prisma.restaurantTable.findUnique({
        where: { id: table.id },
      });
      expect(fresh?.status).toBe(TableStatus.OCCUPIED);

      await repository.completeOrderAndReleaseTable({
        orderId: third.id,
        tableId: table.id,
      });

      fresh = await prisma.restaurantTable.findUnique({
        where: { id: table.id },
      });
      expect(fresh?.status).toBe(TableStatus.AVAILABLE);
    });
  },
);
