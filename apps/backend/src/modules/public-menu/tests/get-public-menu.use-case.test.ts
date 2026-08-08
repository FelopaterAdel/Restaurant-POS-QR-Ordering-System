import { Prisma, TableStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { PublicMenuRepository } from "../repositories/public-menu.repository.js";
import {
  GetPublicMenuUseCase,
  TableDisabledError,
  TableNotFoundError,
} from "../use-cases/get-public-menu.use-case.js";
import { buildCategory, buildProduct, buildTable } from "./public-menu.fixture.js";

function createMockRepository(
  overrides: Partial<PublicMenuRepository> = {},
): PublicMenuRepository {
  return {
    findTableById: vi.fn(),
    findActiveCategoriesWithProducts: vi.fn(),
    ...overrides,
  } as unknown as PublicMenuRepository;
}

describe("GetPublicMenuUseCase", () => {
  it("returns public menu for an available table", async () => {
    const repository = createMockRepository();
    const useCase = new GetPublicMenuUseCase(repository);
    const table = buildTable({ id: "table_1", number: 5 });
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

    vi.mocked(repository.findTableById).mockResolvedValueOnce(table);
    vi.mocked(repository.findActiveCategoriesWithProducts).mockResolvedValueOnce([
      category,
    ]);

    const result = await useCase.execute("table_1");

    expect(repository.findTableById).toHaveBeenCalledWith("table_1");
    expect(result).toEqual({
      table: { id: "table_1", number: 5 },
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

  it("throws TableNotFoundError when the table does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new GetPublicMenuUseCase(repository);

    vi.mocked(repository.findTableById).mockResolvedValueOnce(null);

    await expect(useCase.execute("table_missing")).rejects.toBeInstanceOf(
      TableNotFoundError,
    );
  });

  it("throws TableDisabledError when the table is disabled", async () => {
    const repository = createMockRepository();
    const useCase = new GetPublicMenuUseCase(repository);
    const table = buildTable({ status: TableStatus.DISABLED });

    vi.mocked(repository.findTableById).mockResolvedValueOnce(table);

    await expect(useCase.execute("table_1")).rejects.toBeInstanceOf(
      TableDisabledError,
    );
  });

  it("does not expose internal table fields in the response", async () => {
    const repository = createMockRepository();
    const useCase = new GetPublicMenuUseCase(repository);
    const table = buildTable();

    vi.mocked(repository.findTableById).mockResolvedValueOnce(table);
    vi.mocked(repository.findActiveCategoriesWithProducts).mockResolvedValueOnce(
      [],
    );

    const result = await useCase.execute("table_1");

    expect(result.table).toEqual({ id: "table_1", number: 5 });
    expect(result.table).not.toHaveProperty("qrCode");
    expect(result.table).not.toHaveProperty("status");
    expect(result.table).not.toHaveProperty("createdAt");
    expect(result.table).not.toHaveProperty("updatedAt");
  });
});
