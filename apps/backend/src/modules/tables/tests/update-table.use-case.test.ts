import { Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { TableRepository } from "../repositories/table.repository.js";
import { TableNumberAlreadyExistsError } from "../use-cases/create-table.use-case.js";
import { TableNotFoundError } from "../use-cases/get-table.use-case.js";
import { UpdateTableUseCase } from "../use-cases/update-table.use-case.js";
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

describe("UpdateTableUseCase", () => {
  it("updates a table", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateTableUseCase(repository);
    const existing = buildTable({ id: "table_1", number: 1, name: "Table 1" });
    const updated = buildTable({ id: "table_1", number: 1, name: "Table A" });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);
    vi.mocked(repository.update).mockResolvedValueOnce(updated);

    const result = await useCase.execute("table_1", { name: "Table A" });

    expect(repository.update).toHaveBeenCalledWith("table_1", {
      name: "Table A",
    });
    expect(result).toEqual(updated);
  });

  it("throws TableNotFoundError when the table does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateTableUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute("table_missing", { name: "Table A" }),
    ).rejects.toBeInstanceOf(TableNotFoundError);
  });

  it("rejects updating to a number that already exists", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateTableUseCase(repository);
    const existing = buildTable({ id: "table_1", number: 1 });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);
    vi.mocked(repository.findByNumber).mockResolvedValueOnce(
      buildTable({ id: "table_2", number: 2 }),
    );

    await expect(
      useCase.execute("table_1", { number: 2 }),
    ).rejects.toBeInstanceOf(TableNumberAlreadyExistsError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("rejects a duplicate number reported by the database", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateTableUseCase(repository);
    const existing = buildTable({ id: "table_1", number: 1 });

    const p2002 = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`number`)",
      { code: "P2002", clientVersion: "7.9.1" },
    );

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);
    vi.mocked(repository.findByNumber).mockResolvedValueOnce(null);
    vi.mocked(repository.update).mockRejectedValueOnce(p2002);

    await expect(
      useCase.execute("table_1", { number: 2 }),
    ).rejects.toBeInstanceOf(TableNumberAlreadyExistsError);
  });

  it("returns the table unchanged when nothing is provided", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateTableUseCase(repository);
    const existing = buildTable({ id: "table_1", number: 1 });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);

    const result = await useCase.execute("table_1", {});

    expect(repository.update).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });
});
