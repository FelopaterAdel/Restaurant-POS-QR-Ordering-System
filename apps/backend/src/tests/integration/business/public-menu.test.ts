import { TableStatus, prisma } from "@restaurant/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  api,
  createCategory,
  createProduct,
  createTable,
  dbAvailable,
  RUN_ID,
  TestData,
} from "./test-utils.js";

const td = new TestData();
let activeTable: { id: string; number: number; qrCode: string };
let disabledQrCode: string;
let activeCategory: { id: string; name: string };
let inactiveCategoryName: string;
let availableProduct: { id: string; name: string };
let unavailableProductName: string;
let deletedProductName: string;

const describeAuth = describe.skipIf(!dbAvailable);

describeAuth("public menu via QR (HTTP)", () => {
  beforeAll(async () => {
    activeTable = await createTable(td);

    const disabledTable = await createTable(td);
    disabledQrCode = disabledTable.qrCode;
    await prisma.restaurantTable.update({
      where: { id: disabledTable.id },
      data: { status: TableStatus.DISABLED },
    });

    activeCategory = await createCategory(td);

    const inactiveCategory = await prisma.category.create({
      data: { name: `Inactive ${RUN_ID}`, isActive: false },
    });
    inactiveCategoryName = inactiveCategory.name;
    td.categoryIds.push(inactiveCategory.id);

    const available = await createProduct(td, activeCategory.id);
    availableProduct = { id: available.id, name: available.name };
    const unavailable = await createProduct(td, activeCategory.id, {
      isAvailable: false,
    });
    unavailableProductName = unavailable.name;
    const deleted = await createProduct(td, activeCategory.id, {
      isDeleted: true,
    });
    deletedProductName = deleted.name;
  });

  afterAll(async () => {
    await td.cleanup();
  });

  it("serves the menu for a valid QR code", async () => {
    const res = await api.get(`/api/v1/public/tables/${activeTable.qrCode}/menu`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.table.number).toBe(activeTable.number);

    const categories = res.body.data.categories as Array<{
      name: string;
      products: Array<{ name: string }>;
    }>;
    const names = categories.map((category) => category.name);
    expect(names).toContain(activeCategory.name);
    expect(names).not.toContain(inactiveCategoryName);

    const active = categories.find(
      (category) => category.name === activeCategory.name,
    );
    const productNames = active!.products.map((product) => product.name);
    expect(productNames).toContain(availableProduct.name);
    expect(productNames).not.toContain(unavailableProductName);
    expect(productNames).not.toContain(deletedProductName);
  });

  it("returns TABLE_NOT_FOUND for an unknown QR code", async () => {
    const res = await api.get(
      `/api/v1/public/tables/qr_${RUN_ID}_nonexistent/menu`,
    );
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("TABLE_NOT_FOUND");
  });

  it("returns TABLE_DISABLED for a disabled table QR code", async () => {
    const res = await api.get(`/api/v1/public/tables/${disabledQrCode}/menu`);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("TABLE_DISABLED");
  });
});
