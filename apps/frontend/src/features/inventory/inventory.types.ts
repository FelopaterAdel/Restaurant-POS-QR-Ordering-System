export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  quantityInStock: number | string;
  lowStockThreshold: number | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIngredientInput {
  name: string;
  unit: string;
  quantityInStock?: number;
  lowStockThreshold?: number;
}

export interface UpdateIngredientInput {
  name?: string;
  unit?: string;
  quantityInStock?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
}

export interface RecipeItem {
  id: string;
  productId: string;
  ingredientId: string;
  quantityUsed: number | string;
  createdAt: string;
  updatedAt: string;
  ingredient?: Ingredient;
}

export interface SetRecipeInput {
  items: Array<{ ingredientId: string; quantityUsed: number }>;
}
