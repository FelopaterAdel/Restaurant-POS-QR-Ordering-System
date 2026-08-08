import { describe, expect, it, vi } from "vitest";
import { TableStatus } from "@restaurant/database";
import { TableRepository } from "../repositories/table.repository.js";
import { DisableTableUseCase } from "../use-cases/disable-table.use-case.js";
import { TableNotFoundError } from "../use-cases/get-table.use-case.js";
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

describe("DisableTableUseCase", () => {
  it("disables an available table", async () => {
    const repository = createMockRepository();
    const useCase = new DisableTableUseCase(repository);
    const existing = buildTable({ id: "table_1", status: TableStatus.AVAILABLE });
    const disabled = buildTable({
      id: "table_1",
      status: TableStatus.DISABLED,
    });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);
    vi.mocked(repository.disable).mockResolvedValueOnce(disabled);

    const result = await useCase.execute("table_1");

    expect(repository.disable).toHaveBeenCalledWith("table_1");
    expect(result).toEqual(disabled);
  });

  it("throws TableNotFoundError when the table does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new DisableTableUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute("table_missing")).rejects.toBeInstanceOf(
      TableNotFoundError,
    );
  });

  it("does not update an already disabled table", async () => {
    const repository = createMockRepository();
    const useCase = new DisableTableUseCase(repository);
    const existing = buildTable({ id: "table_1", status: TableStatus.DISABLED });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);

    const result = await useCase.execute("table_1");

    expect(repository.disable).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });
});
