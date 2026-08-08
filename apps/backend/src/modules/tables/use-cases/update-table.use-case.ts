import { Prisma } from "@restaurant/database";
import type { RestaurantTable } from "@restaurant/database";
import { TableRepository } from "../repositories/table.repository.js";
import {
  updateTableSchema,
  type UpdateTableDTO,
} from "../schemas/update-table.schema.js";
import { TableNumberAlreadyExistsError } from "./create-table.use-case.js";
import { TableNotFoundError } from "./get-table.use-case.js";

export class UpdateTableUseCase {
  private readonly tableRepository: TableRepository;

  constructor(
    tableRepository: TableRepository = new TableRepository(),
  ) {
    this.tableRepository = tableRepository;
  }

  async execute(id: string, input: UpdateTableDTO): Promise<RestaurantTable> {
    const data = updateTableSchema.parse(input);

    const existing = await this.tableRepository.findById(id);
    if (!existing) {
      throw new TableNotFoundError();
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    if (data.number && data.number !== existing.number) {
      const duplicate = await this.tableRepository.findByNumber(data.number);
      if (duplicate) {
        throw new TableNumberAlreadyExistsError();
      }
    }

    try {
      return await this.tableRepository.update(id, data);
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
