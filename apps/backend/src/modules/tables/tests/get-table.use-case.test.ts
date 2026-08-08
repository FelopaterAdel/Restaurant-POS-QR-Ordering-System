import { describe, expect, it, vi } from "vitest";
import { TableRepository } from "../repositories/table.repository.js";
import {
  GetTableUseCase,
  TableNotFoundError,
} from "../use-cases/get-table.use-case.js";
import { buildTable } from "./table.fixture.js";

function createMockRepository(
  overrides: Partial<TableRepository> = {},
): TableRepository {
  return {
    findById: vi.fn(),
    findByNumber: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    disable: vi.fn(),
    ...overrides,
  } as unknown as TableRepository;
}

describe("GetTableUseCase", () => {
  it("returns the table when it exists", async () => {
    const repository = createMockRepository();
    const useCase = new GetTableUseCase(repository);
    const table = buildTable({ id: "table_1" });

    vi.mocked(repository.findById).mockResolvedValueOnce(table);

    const result = await useCase.execute("table_1");

    expect(repository.findById).toHaveBeenCalledWith("table_1");
    expect(result).toEqual(table);
  });

  it("throws TableNotFoundError when the table does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new GetTableUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute("table_missing")).rejects.toBeInstanceOf(
      TableNotFoundError,
    );
  });
});
