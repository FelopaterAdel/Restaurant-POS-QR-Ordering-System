import { TableStatus } from "@restaurant/database";
import { PublicMenuRepository } from "../repositories/public-menu.repository.js";

export interface PublicTableDTO {
  id: string;
  number: number;
}

export interface PublicProductDTO {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface PublicCategoryDTO {
  id: string;
  name: string;
  products: PublicProductDTO[];
}

export interface PublicMenuDTO {
  table: PublicTableDTO;
  categories: PublicCategoryDTO[];
}

export class TableNotFoundError extends Error {
  constructor() {
    super("Table not found");
    this.name = "TableNotFoundError";
  }
}

export class TableDisabledError extends Error {
  constructor() {
    super("Table is disabled");
    this.name = "TableDisabledError";
  }
}

export class GetPublicMenuUseCase {
  private readonly publicMenuRepository: PublicMenuRepository;

  constructor(
    publicMenuRepository: PublicMenuRepository = new PublicMenuRepository(),
  ) {
    this.publicMenuRepository = publicMenuRepository;
  }

  async execute(tableId: string): Promise<PublicMenuDTO> {
    const table = await this.publicMenuRepository.findTableById(tableId);

    if (!table) {
      throw new TableNotFoundError();
    }

    if (table.status === TableStatus.DISABLED) {
      throw new TableDisabledError();
    }

    const categories =
      await this.publicMenuRepository.findActiveCategoriesWithProducts();

    return {
      table: {
        id: table.id,
        number: table.number,
      },
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        products: category.products.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          imageUrl: product.imageUrl,
          isAvailable: product.isAvailable,
        })),
      })),
    };
  }
}
