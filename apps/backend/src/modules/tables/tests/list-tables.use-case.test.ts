import { describe, expect, it, vi } from "vitest";
import { TableStatus } from "@restaurant/database";
import { TableRepository } from "../repositories/table.repository.js";
import { ListTablesUseCase } from "../use-cases/list-tables.use-case.js";
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

describe("ListTablesUseCase", () => {
  it("returns all tables including disabled ones", async () => {
    const repository = createMockRepository();
    const useCase = new ListTablesUseCase(repository);

    const tables = [
      buildTable({ id: "table_1", number: 1 }),
      buildTable({
        id: "table_2",
        number: 2,
        status: TableStatus.DISABLED,
      }),
    ];

    vi.mocked(repository.findAll).mockResolvedValueOnce(tables);

    const result = await useCase.execute();

    expect(repository.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual(tables);
  });
});
