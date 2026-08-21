import { TableStatus } from "@restaurant/database";
import type { RestaurantTable } from "@restaurant/database";
import { TableRepository } from "../repositories/table.repository.js";
import { TableNotFoundError } from "./get-table.use-case.js";

export class EnableTableUseCase {
  private readonly tableRepository: TableRepository;

  constructor(
    tableRepository: TableRepository = new TableRepository(),
  ) {
    this.tableRepository = tableRepository;
  }

  async execute(id: string): Promise<RestaurantTable> {
    const existing = await this.tableRepository.findById(id);
    if (!existing) {
      throw new TableNotFoundError();
    }

    if (existing.status !== TableStatus.DISABLED) {
      return existing;
    }

    return this.tableRepository.enable(id);
  }
}
