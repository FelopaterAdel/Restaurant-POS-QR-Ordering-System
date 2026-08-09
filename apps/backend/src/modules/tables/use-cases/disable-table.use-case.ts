import { TableStatus } from "@restaurant/database";
import type { RestaurantTable } from "@restaurant/database";
import { ConflictError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { TableRepository } from "../repositories/table.repository.js";
import { TableNotFoundError } from "./get-table.use-case.js";

export class DisableTableUseCase {
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

    if (existing.status === TableStatus.DISABLED) {
      return existing;
    }

    const activeOrders = await this.tableRepository.countActiveOrders(id);
    if (activeOrders > 0) {
      throw new TableHasActiveOrdersError();
    }

    return this.tableRepository.disable(id);
  }
}

export class TableHasActiveOrdersError extends ConflictError {
  constructor() {
    super(
      AppErrorCode.TABLE_HAS_ACTIVE_ORDERS,
      "Table cannot be disabled because it has active orders",
    );
    this.name = "TableHasActiveOrdersError";
  }
}
