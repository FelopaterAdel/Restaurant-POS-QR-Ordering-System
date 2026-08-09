import { Prisma, prisma } from "@restaurant/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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
const TABLE_NUMBER = Math.floor(Math.random() * 90_000) + 10_000;

let tableId: string;
const createdOrderIds: string[] = [];

describe.skipIf(!dbAvailable)("Order number uniqueness", () => {
  beforeAll(async () => {
    if (!dbAvailable) {
      return;
    }

    const table = await prisma.restaurantTable.create({
      data: {
        number: TABLE_NUMBER,
        name: `OrderNumberTest ${RUN_ID}`,
        qrCode: `ordernumber_${RUN_ID}`,
      },
    });
    tableId = table.id;
  });

  afterAll(async () => {
    if (!dbAvailable) {
      return;
    }

    await prisma.order.deleteMany({
      where: { id: { in: createdOrderIds } },
    });
    await prisma.restaurantTable.delete({ where: { id: tableId } });
  });

  it("assigns unique numbers to concurrent orders", async () => {
    if (!dbAvailable) {
      return;
    }

    const created = await Promise.all(
      Array.from({ length: 25 }, () =>
        prisma.order.create({
          data: {
            tableId,
            totalAmount: new Prisma.Decimal(10),
          },
        }),
      ),
    );

    createdOrderIds.push(...created.map((order) => order.id));

    const numbers = created.map((order) => order.orderNumber);
    expect(numbers).toHaveLength(25);
    expect(new Set(numbers).size).toBe(numbers.length);
    expect(numbers.every((n) => Number.isInteger(n))).toBe(true);
  });

  it("returns sequentially increasing order numbers", async () => {
    if (!dbAvailable) {
      return;
    }

    const first = await prisma.order.create({
      data: { tableId, totalAmount: new Prisma.Decimal(5) },
    });
    const second = await prisma.order.create({
      data: { tableId, totalAmount: new Prisma.Decimal(5) },
    });
    const third = await prisma.order.create({
      data: { tableId, totalAmount: new Prisma.Decimal(5) },
    });

    createdOrderIds.push(first.id, second.id, third.id);

    expect(first.orderNumber).toBeLessThan(second.orderNumber);
    expect(second.orderNumber).toBeLessThan(third.orderNumber);
  });
});
