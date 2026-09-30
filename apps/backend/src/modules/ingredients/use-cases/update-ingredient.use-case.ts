import { AuditAction, Prisma } from "@restaurant/database";
import type { Ingredient } from "@restaurant/database";
import { AuditService } from "../../audit/services/audit.service.js";
import { IngredientRepository } from "../repositories/ingredient.repository.js";
import {
  updateIngredientSchema,
  type UpdateIngredientDTO,
} from "../schemas/update-ingredient.schema.js";
import { GetIngredientUseCase } from "./get-ingredient.use-case.js";
import { IngredientNameAlreadyExistsError } from "./create-ingredient.use-case.js";

export class UpdateIngredientUseCase {
  private readonly ingredientRepository: IngredientRepository;
  private readonly getIngredientUseCase: GetIngredientUseCase;
  private readonly auditService: AuditService;

  constructor(
    ingredientRepository: IngredientRepository = new IngredientRepository(),
    auditService: AuditService = new AuditService(),
  ) {
    this.ingredientRepository = ingredientRepository;
    this.getIngredientUseCase = new GetIngredientUseCase(ingredientRepository);
    this.auditService = auditService;
  }

  async execute(
    id: string,
    input: UpdateIngredientDTO,
    actorId?: string,
  ): Promise<Ingredient> {
    const data = updateIngredientSchema.parse(input);

    const before = await this.getIngredientUseCase.execute(id);

    if (data.name) {
      const existing = await this.ingredientRepository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new IngredientNameAlreadyExistsError();
      }
    }

    try {
      const updated = await this.ingredientRepository.update(id, data);

      if (
        data.quantityInStock !== undefined &&
        Number(before.quantityInStock) !== Number(updated.quantityInStock)
      ) {
        await this.auditService.record({
          userId: actorId ?? null,
          action: AuditAction.STOCK_ADJUSTED,
          entityType: "INGREDIENT",
          entityId: updated.id,
          details: {
            name: updated.name,
            unit: updated.unit,
            before: Number(before.quantityInStock),
            after: Number(updated.quantityInStock),
          },
        });
      }

      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new IngredientNameAlreadyExistsError();
      }
      throw error;
    }
  }
}
