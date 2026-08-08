import type { RestaurantTable } from "@restaurant/database";
import { TableRepository } from "../repositories/table.repository.js";

export class TableNotFoundError extends Error {
  constructor() {
    super("Table not found");
    this.name = "TableNotFoundError";
  }
}

export class GetTableUseCase {
  private readonly tableRepository: TableRepository;

  constructor(
    tableRepository: TableRepository = new TableRepository(),
  ) {
    this.tableRepository = tableRepository;
  }

  async execute(id: string): Promise<RestaurantTable> {
    const table = await this.tableRepository.findById(id);

    if (!table) {
      throw new TableNotFoundError();
    }

    return table;
  }
}
