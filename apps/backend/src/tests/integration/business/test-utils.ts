import { Prisma, UserRole, prisma } from "@restaurant/database";
import request from "supertest";
import app from "../../../app.js";
import { PasswordService } from "../../../infra/security/password.service.js";

export const dbAvailable = await checkDatabaseAvailable();

export const api = request(app);

export const RUN_ID = `${Date.now().toString(36)}_${Math.floor(
  Math.random() * 1_000_000,
).toString(36)}`;

export const TEST_PASSWORD = "TestPass123!";

const passwordService = new PasswordService(4);

async function checkDatabaseAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export class TestData {
  orderIds: string[] = [];
  tableIds: string[] = [];
  productIds: string[] = [];
  categoryIds: string[] = [];
  userIds: string[] = [];

  async cleanup(): Promise<void> {
    await prisma.payment.deleteMany({
      where: { orderId: { in: this.orderIds } },
    });
    await prisma.order.deleteMany({ where: { id: { in: this.orderIds } } });
    await prisma.restaurantTable.deleteMany({
      where: { id: { in: this.tableIds } },
    });
    await prisma.product.deleteMany({ where: { id: { in: this.productIds } } });
    await prisma.category.deleteMany({
      where: { id: { in: this.categoryIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: this.userIds } } });
  }
}

export async function createUserDirect(
  td: TestData,
  overrides: {
    email?: string;
    name?: string;
    role?: UserRole;
    status?: "ACTIVE" | "INACTIVE";
    password?: string;
  } = {},
) {
  const email = (
    overrides.email ?? `user_${RUN_ID}_${td.userIds.length}@example.com`
  ).toLowerCase();
  const user = await prisma.user.create({
    data: {
      email,
      name: overrides.name ?? "Test User",
      password: await passwordService.hash(overrides.password ?? TEST_PASSWORD),
      role: overrides.role ?? UserRole.CASHIER,
      status: overrides.status ?? "ACTIVE",
    },
  });
  td.userIds.push(user.id);
  return user;
}

export async function ensureOwner(td: TestData) {
  const email = `owner_${RUN_ID}_${td.userIds.length}@example.com`;
  const res = await api
    .post("/api/v1/auth/bootstrap/owner")
    .send({ name: "Test Owner", email, password: TEST_PASSWORD });
  if (res.status === 201) {
    td.userIds.push(res.body.data.id);
    return res.body.data;
  }
  return createUserDirect(td, {
    email,
    name: "Test Owner",
    role: UserRole.OWNER,
  });
}

export async function loginAs(email: string, password: string = TEST_PASSWORD) {
  return api.post("/api/v1/auth/login").send({ email, password });
}

export async function loginAsAndGetToken(
  email: string,
  password: string = TEST_PASSWORD,
): Promise<string> {
  const res = await loginAs(email, password);
  if (res.status !== 200) {
    throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.accessToken;
}

export async function createTable(td: TestData) {
  const number = Math.floor(Math.random() * 90_000_000) + 10_000_000;
  const table = await prisma.restaurantTable.create({
    data: {
      number,
      name: `Tbl ${RUN_ID} ${number}`,
      qrCode: `qr_${RUN_ID}_${number}`,
    },
  });
  td.tableIds.push(table.id);
  return table;
}

export async function createCategory(td: TestData) {
  const category = await prisma.category.create({
    data: { name: `Cat ${RUN_ID}_${td.categoryIds.length}` },
  });
  td.categoryIds.push(category.id);
  return category;
}

export async function createProduct(
  td: TestData,
  categoryId: string,
  opts: { price?: number; isAvailable?: boolean; isDeleted?: boolean } = {},
) {
  const product = await prisma.product.create({
    data: {
      categoryId,
      name: `Prod ${RUN_ID}_${td.productIds.length}`,
      price: new Prisma.Decimal(opts.price ?? 100),
      isAvailable: opts.isAvailable ?? true,
      isDeleted: opts.isDeleted ?? false,
    },
  });
  td.productIds.push(product.id);
  return product;
}

export async function createOrderViaApi(
  td: TestData,
  tableId: string,
  productId: string,
  quantity = 1,
) {
  const res = await api
    .post("/api/v1/public/orders")
    .send({ tableId, items: [{ productId, quantity }] });
  if (res.status === 201) {
    td.orderIds.push(res.body.data.id);
  }
  return res;
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  accessToken: string,
) {
  return api
    .patch(`/api/v1/orders/${orderId}/status`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ status });
}

export async function advanceOrderToReady(
  orderId: string,
  accessToken: string,
) {
  for (const status of ["CONFIRMED", "PREPARING", "READY"]) {
    const res = await updateOrderStatus(orderId, status, accessToken);
    if (res.status !== 200) {
      throw new Error(
        `advance to ${status} failed: ${res.status} ${JSON.stringify(res.body)}`,
      );
    }
  }
}

export async function payOrder(
  orderId: string,
  accessToken: string,
  method: "CASH" | "CARD" | "ONLINE" = "CASH",
) {
  return api
    .post(`/api/v1/orders/${orderId}/payment`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ method });
}

export async function completeOrder(orderId: string, accessToken: string) {
  return api
    .post(`/api/v1/orders/${orderId}/complete`)
    .set("Authorization", `Bearer ${accessToken}`);
}

export async function cancelOrder(
  orderId: string,
  accessToken: string,
  reason?: string,
) {
  return api
    .patch(`/api/v1/orders/${orderId}/cancel`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send(reason ? { reason } : {});
}

export async function getTableById(tableId: string, accessToken: string) {
  return api
    .get(`/api/v1/tables/${tableId}`)
    .set("Authorization", `Bearer ${accessToken}`);
}
