import { Prisma, TableStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { PublicMenuRepository } from "../repositories/public-menu.repository.js";
import {
  GetPublicMenuUseCase,
  TableDisabledError,
  TableNotFoundError,
} from "../use-cases/get-public-menu.use-case.js";
import {
  buildCategory,
  buildProduct,
  buildRestaurant,
  buildTable,
} from "./public-menu.fixture.js";

function createMockRepository(
  overrides: Partial<PublicMenuRepository> = {},
): PublicMenuRepository {
  return {
    findTableByQrCode: vi.fn(),
    findActiveCategoriesWithProducts: vi.fn(),
    findRestaurant: vi.fn(),
    ...overrides,
  } as unknown as PublicMenuRepository;
}

describe("GetPublicMenuUseCase", () => {
  it("returns public menu for an available table by qr code", async () => {
    const repository = createMockRepository();
    const useCase = new GetPublicMenuUseCase(repository);
    const table = buildTable({ id: "table_1", number: 5, qrCode: "tbl_abc123" });
    const category = buildCategory({
      id: "cat_1",
      name: "Pizza",
      products: [
        buildProduct({
          id: "prod_1",
          name: "Margherita Pizza",
          price: new Prisma.Decimal(150),
        }),
      ],
    });
    const restaurant = buildRestaurant();

    vi.mocked(repository.findTableByQrCode).mockResolvedValueOnce(table);
    vi.mocked(repository.findActiveCategoriesWithProducts).mockResolvedValueOnce([
      category,
    ]);
    vi.mocked(repository.findRestaurant).mockResolvedValueOnce(restaurant);

    const result = await useCase.execute("tbl_abc123");

    expect(repository.findTableByQrCode).toHaveBeenCalledWith("tbl_abc123");
    expect(result).toEqual({
      table: { id: "table_1", number: 5 },
      restaurant: { name: "Test Restaurant", logoUrl: "https://example.com/logo.png" },
      categories: [
        {
          id: "cat_1",
          name: "Pizza",
          products: [
            {
              id: "prod_1",
              name: "Margherita Pizza",
              description: null,
              price: 150,
              imageUrl: null,
              isAvailable: true,
            },
          ],
        },
      ],
    });
  });

  it("returns null restaurant when no restaurant is configured", async () => {
    const repository = createMockRepository();
    const useCase = new GetPublicMenuUseCase(repository);
    const table = buildTable();

    vi.mocked(repository.findTableByQrCode).mockResolvedValueOnce(table);
    vi.mocked(repository.findActiveCategoriesWithProducts).mockResolvedValueOnce([]);
    vi.mocked(repository.findRestaurant).mockResolvedValueOnce(null);

    const result = await useCase.execute("tbl_abc123");

    expect(result.restaurant).toBeNull();
  });

  it("throws TableNotFoundError when no table matches the qr code", async () => {
    const repository = createMockRepository();
    const useCase = new GetPublicMenuUseCase(repository);

    vi.mocked(repository.findTableByQrCode).mockResolvedValueOnce(null);

    await expect(useCase.execute("tbl_missing")).rejects.toBeInstanceOf(
      TableNotFoundError,
    );
  });

  it("throws TableDisabledError when the table is disabled", async () => {
    const repository = createMockRepository();
    const useCase = new GetPublicMenuUseCase(repository);
    const table = buildTable({ status: TableStatus.DISABLED });

    vi.mocked(repository.findTableByQrCode).mockResolvedValueOnce(table);

    await expect(useCase.execute("tbl_abc123")).rejects.toBeInstanceOf(
      TableDisabledError,
    );
  });

  it("does not expose internal table fields in the response", async () => {
    const repository = createMockRepository();
    const useCase = new GetPublicMenuUseCase(repository);
    const table = buildTable();

    vi.mocked(repository.findTableByQrCode).mockResolvedValueOnce(table);
    vi.mocked(repository.findActiveCategoriesWithProducts).mockResolvedValueOnce(
      [],
    );

    const result = await useCase.execute("tbl_abc123");

    expect(result.table).toEqual({ id: "table_1", number: 5 });
    expect(result.table).not.toHaveProperty("qrCode");
    expect(result.table).not.toHaveProperty("status");
    expect(result.table).not.toHaveProperty("createdAt");
    expect(result.table).not.toHaveProperty("updatedAt");
  });
});
