import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import { getHealth } from "@/services/health";
import { getPublicMenu } from "@/services/public-menu";

const TEST_QR_CODE = "tbl_test_0001";

describe("backend integration", () => {
  it("reaches the health endpoint", async () => {
    const health = await getHealth();
    expect(health.success).toBe(true);
    expect(health.message).toBe("Server is running");
  });

  it("unwraps the standard envelope for a public endpoint", async () => {
    const menu = await getPublicMenu(TEST_QR_CODE);
    expect(menu.table.number).toBeGreaterThan(0);
    expect(Array.isArray(menu.categories)).toBe(true);

    const categoryWithProducts = menu.categories.find(
      (category) => category.products.length > 0,
    );
    expect(categoryWithProducts).toBeDefined();
    expect(categoryWithProducts?.products[0]?.price).toBeTypeOf("number");
    expect(categoryWithProducts?.products[0]?.isAvailable).toBe(true);
  });

  it("normalizes a 404 into ApiError", async () => {
    try {
      await getPublicMenu("tbl_does_not_exist");
      expect.fail("expected the request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        status: 404,
        code: "TABLE_NOT_FOUND",
        message: "Table not found",
      });
    }
  });
});
