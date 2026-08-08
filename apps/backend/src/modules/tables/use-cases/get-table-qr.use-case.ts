import { env } from "../../../config/env.js";
import { QrCodeService } from "../../../infra/qr/qr-code.service.js";
import { TableRepository } from "../repositories/table.repository.js";
import { TableNotFoundError } from "./get-table.use-case.js";

export class GetTableQrUseCase {
  private readonly tableRepository: TableRepository;
  private readonly qrCodeService: QrCodeService;

  constructor(
    tableRepository: TableRepository = new TableRepository(),
    qrCodeService: QrCodeService = new QrCodeService(),
  ) {
    this.tableRepository = tableRepository;
    this.qrCodeService = qrCodeService;
  }

  async execute(id: string): Promise<Buffer> {
    const table = await this.tableRepository.findById(id);

    if (!table) {
      throw new TableNotFoundError();
    }

    const menuUrl = `${env.publicBaseUrl}/menu/table/${table.qrCode}`;

    return this.qrCodeService.generate(menuUrl);
  }
}
