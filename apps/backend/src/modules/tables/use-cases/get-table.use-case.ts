import type { RestaurantTable } from "@restaurant/database";
import { NotFoundError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { TableRepository } from "../repositories/table.repository.js";

export class TableNotFoundError extends NotFoundError {
  constructor() {
    super(AppErrorCode.TABLE_NOT_FOUND, "Table not found");
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
