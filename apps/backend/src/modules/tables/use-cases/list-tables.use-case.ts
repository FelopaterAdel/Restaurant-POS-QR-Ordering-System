import type { RestaurantTable } from "@restaurant/database";
import { TableRepository } from "../repositories/table.repository.js";

export class ListTablesUseCase {
  private readonly tableRepository: TableRepository;

  constructor(
    tableRepository: TableRepository = new TableRepository(),
  ) {
    this.tableRepository = tableRepository;
  }

  async execute(): Promise<RestaurantTable[]> {
    return this.tableRepository.findAll();
  }
}
