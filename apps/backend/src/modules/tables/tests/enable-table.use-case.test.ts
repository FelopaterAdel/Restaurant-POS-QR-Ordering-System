import { describe, expect, it, vi } from "vitest";
import { TableStatus } from "@restaurant/database";
import { TableRepository } from "../repositories/table.repository.js";
import { EnableTableUseCase } from "../use-cases/enable-table.use-case.js";
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
    enable: vi.fn(),
    countActiveOrders: vi.fn(),
    ...overrides,
  } as unknown as TableRepository;
}

describe("EnableTableUseCase", () => {
  it("enables a disabled table", async () => {
    const repository = createMockRepository();
    const useCase = new EnableTableUseCase(repository);
    const existing = buildTable({ id: "table_1", status: TableStatus.DISABLED });
    const enabled = buildTable({
      id: "table_1",
      status: TableStatus.AVAILABLE,
    });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);
    vi.mocked(repository.enable).mockResolvedValueOnce(enabled);

    const result = await useCase.execute("table_1");

    expect(repository.enable).toHaveBeenCalledWith("table_1");
    expect(result).toEqual(enabled);
  });

  it("throws TableNotFoundError when the table does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new EnableTableUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute("table_missing")).rejects.toBeInstanceOf(
      TableNotFoundError,
    );
    expect(repository.enable).not.toHaveBeenCalled();
  });

  it("does not update an already available table", async () => {
    const repository = createMockRepository();
    const useCase = new EnableTableUseCase(repository);
    const existing = buildTable({
      id: "table_1",
      status: TableStatus.AVAILABLE,
    });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);

    const result = await useCase.execute("table_1");

    expect(repository.enable).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });

  it("does not reset an occupied table to available", async () => {
    const repository = createMockRepository();
    const useCase = new EnableTableUseCase(repository);
    const existing = buildTable({
      id: "table_1",
      status: TableStatus.OCCUPIED,
    });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);

    const result = await useCase.execute("table_1");

    expect(repository.enable).not.toHaveBeenCalled();
    expect(result.status).toBe(TableStatus.OCCUPIED);
  });
});
