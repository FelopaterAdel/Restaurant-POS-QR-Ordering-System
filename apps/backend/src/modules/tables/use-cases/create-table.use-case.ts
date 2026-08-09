import { randomBytes } from "node:crypto";
import { Prisma } from "@restaurant/database";
import type { RestaurantTable } from "@restaurant/database";
import { ConflictError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { TableRepository } from "../repositories/table.repository.js";
import {
  createTableSchema,
  type CreateTableDTO,
} from "../schemas/create-table.schema.js";

export class TableNumberAlreadyExistsError extends ConflictError {
  constructor() {
    super(
      AppErrorCode.TABLE_NUMBER_ALREADY_EXISTS,
      "A table with this number already exists",
    );
    this.name = "TableNumberAlreadyExistsError";
  }
}

function generateQrCode(): string {
  return `tbl_${randomBytes(9).toString("base64url")}`;
}

export class CreateTableUseCase {
  private readonly tableRepository: TableRepository;

  constructor(
    tableRepository: TableRepository = new TableRepository(),
  ) {
    this.tableRepository = tableRepository;
  }

  async execute(input: CreateTableDTO): Promise<RestaurantTable> {
    const data = createTableSchema.parse(input);

    const existing = await this.tableRepository.findByNumber(data.number);
    if (existing) {
      throw new TableNumberAlreadyExistsError();
    }

    const qrCode = generateQrCode();

    try {
      return await this.tableRepository.create({
        number: data.number,
        name: data.name,
        qrCode,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new TableNumberAlreadyExistsError();
      }
      throw error;
    }
  }
}
