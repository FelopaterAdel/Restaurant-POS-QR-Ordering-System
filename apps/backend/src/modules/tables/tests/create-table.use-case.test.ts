import { Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { TableRepository } from "../repositories/table.repository.js";
import {
  CreateTableUseCase,
  TableNumberAlreadyExistsError,
} from "../use-cases/create-table.use-case.js";
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

describe("CreateTableUseCase", () => {
  it("creates a table with a generated qrCode", async () => {
    const repository = createMockRepository();
    const useCase = new CreateTableUseCase(repository);
    const table = buildTable();

    vi.mocked(repository.findByNumber).mockResolvedValueOnce(null);
    vi.mocked(repository.create).mockResolvedValueOnce(table);

    const result = await useCase.execute({ number: 1, name: "Table 1" });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        number: 1,
        name: "Table 1",
        qrCode: expect.stringMatching(/^tbl_/),
      }),
    );
    expect(result).toEqual(table);
  });

  it("rejects a duplicate table number", async () => {
    const repository = createMockRepository();
    const useCase = new CreateTableUseCase(repository);

    vi.mocked(repository.findByNumber).mockResolvedValueOnce(
      buildTable({ number: 1 }),
    );

    await expect(
      useCase.execute({ number: 1, name: "Table 1" }),
    ).rejects.toBeInstanceOf(TableNumberAlreadyExistsError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate number reported by the database", async () => {
    const repository = createMockRepository();
    const useCase = new CreateTableUseCase(repository);

    const p2002 = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`number`)",
      { code: "P2002", clientVersion: "7.9.1" },
    );

    vi.mocked(repository.findByNumber).mockResolvedValueOnce(null);
    vi.mocked(repository.create).mockRejectedValueOnce(p2002);

    await expect(
      useCase.execute({ number: 1, name: "Table 1" }),
    ).rejects.toBeInstanceOf(TableNumberAlreadyExistsError);
  });
});
