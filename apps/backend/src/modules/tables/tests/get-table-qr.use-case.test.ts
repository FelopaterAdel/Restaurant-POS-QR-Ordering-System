import { describe, expect, it, vi } from "vitest";
import { env } from "../../../config/env.js";
import { QrCodeService } from "../../../infra/qr/qr-code.service.js";
import { TableRepository } from "../repositories/table.repository.js";
import { GetTableQrUseCase } from "../use-cases/get-table-qr.use-case.js";
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

function createMockQrCodeService(
  overrides: Partial<QrCodeService> = {},
): QrCodeService {
  return {
    generate: vi.fn(),
    ...overrides,
  } as unknown as QrCodeService;
}

describe("GetTableQrUseCase", () => {
  it("generates a QR pointing to the table menu URL", async () => {
    const repository = createMockRepository();
    const qrCodeService = createMockQrCodeService();
    const useCase = new GetTableQrUseCase(repository, qrCodeService);
    const table = buildTable({ id: "table_1", qrCode: "tbl_abc123" });

    vi.mocked(repository.findById).mockResolvedValueOnce(table);
    vi.mocked(qrCodeService.generate).mockResolvedValueOnce(Buffer.from("png"));

    const result = await useCase.execute("table_1");

    expect(repository.findById).toHaveBeenCalledWith("table_1");
    expect(qrCodeService.generate).toHaveBeenCalledWith(
      `${env.publicBaseUrl}/menu/table/tbl_abc123`,
    );
    expect(result).toEqual(Buffer.from("png"));
  });

  it("throws TableNotFoundError when the table does not exist", async () => {
    const repository = createMockRepository();
    const qrCodeService = createMockQrCodeService();
    const useCase = new GetTableQrUseCase(repository, qrCodeService);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute("table_missing")).rejects.toBeInstanceOf(
      TableNotFoundError,
    );
    expect(qrCodeService.generate).not.toHaveBeenCalled();
  });
});
