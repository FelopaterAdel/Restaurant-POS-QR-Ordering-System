import { UserRole } from "@restaurant/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  api,
  createCategory,
  createOrderViaApi,
  createProduct,
  createTable,
  dbAvailable,
  ensureOwner,
  loginAsAndGetToken,
  payOrder,
  RUN_ID,
  TEST_PASSWORD,
  TestData,
} from "./test-utils.js";

const td = new TestData();
const tokens: Partial<Record<UserRole, string>> = {};

const describeAuth = describe.skipIf(!dbAvailable);

describeAuth("authorization (HTTP)", () => {
  beforeAll(async () => {
    const owner = await ensureOwner(td);
    tokens[UserRole.OWNER] = await loginAsAndGetToken(owner.email);

    const staffRoles = [
      UserRole.MANAGER,
      UserRole.CASHIER,
      UserRole.WAITER,
      UserRole.KITCHEN,
    ];
    for (const role of staffRoles) {
      const email = `staff_${RUN_ID}_${role.toLowerCase()}@example.com`;
      const res = await api
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${tokens[UserRole.OWNER]}`)
        .send({ name: `Staff ${role}`, email, password: TEST_PASSWORD, role });
      expect(res.status).toBe(201);
      td.userIds.push(res.body.data.id);
      tokens[role] = await loginAsAndGetToken(email);
    }
  }, 30_000);

  afterAll(async () => {
    await td.cleanup();
  });

  it.each([
    [UserRole.OWNER, 200],
    [UserRole.MANAGER, 200],
    [UserRole.CASHIER, 403],
    [UserRole.WAITER, 403],
    [UserRole.KITCHEN, 403],
  ] as const)(
    "dashboard summary is %s-accessible (status %i)",
    async (role, expected) => {
      const res = await api
        .get("/api/v1/dashboard/summary")
        .set("Authorization", `Bearer ${tokens[role]}`);
      expect(res.status).toBe(expected);
    },
  );

  it("rejects dashboard access without a token", async () => {
    const res = await api.get("/api/v1/dashboard/summary");
    expect(res.status).toBe(401);
  });

  it("rejects dashboard access with a garbage token", async () => {
    const res = await api
      .get("/api/v1/dashboard/summary")
      .set("Authorization", "Bearer garbage");
    expect(res.status).toBe(401);
  });

  it("allows only the owner to create users", async () => {
    const res = await api
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${tokens[UserRole.CASHIER]}`)
      .send({
        name: "Unauthorized",
        email: `hacker_${RUN_ID}@example.com`,
        password: TEST_PASSWORD,
        role: UserRole.MANAGER,
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  describe("payment role matrix", () => {
    let tableId: string;
    let productId: string;

    beforeAll(async () => {
      const table = await createTable(td);
      tableId = table.id;
      const category = await createCategory(td);
      const product = await createProduct(td, category.id);
      productId = product.id;
    });

    async function readyOrder(): Promise<string> {
      const created = await createOrderViaApi(td, tableId, productId);
      expect(created.status).toBe(201);
      const orderId = created.body.data.id as string;

      for (const status of ["CONFIRMED", "PREPARING", "READY"]) {
        const res = await api
          .patch(`/api/v1/orders/${orderId}/status`)
          .set("Authorization", `Bearer ${tokens[UserRole.OWNER]}`)
          .send({ status });
        expect(res.status).toBe(200);
      }
      return orderId;
    }

    it.each([
      [UserRole.OWNER, 201],
      [UserRole.MANAGER, 201],
      [UserRole.CASHIER, 201],
    ] as const)("accepts payment from %s", async (role, expected) => {
      const orderId = await readyOrder();
      const res = await payOrder(orderId, tokens[role]!);
      expect(res.status).toBe(expected);
    });

    it.each([
      [UserRole.WAITER, 403],
      [UserRole.KITCHEN, 403],
    ] as const)("rejects payment from %s", async (role, expected) => {
      const orderId = await readyOrder();
      const res = await payOrder(orderId, tokens[role]!);
      expect(res.status).toBe(expected);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });
});
