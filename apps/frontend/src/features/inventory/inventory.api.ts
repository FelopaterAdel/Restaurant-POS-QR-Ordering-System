import { api } from "@/lib/api";
import type {
  CreateIngredientInput,
  Ingredient,
  RecipeItem,
  SetRecipeInput,
  UpdateIngredientInput,
} from "./inventory.types";

export async function listIngredients(): Promise<Ingredient[]> {
  return api.get<Ingredient[]>("/ingredients?all=true");
}

export async function getIngredient(ingredientId: string): Promise<Ingredient> {
  return api.get<Ingredient>(`/ingredients/${ingredientId}`);
}

export async function listLowStock(): Promise<Ingredient[]> {
  return api.get<Ingredient[]>("/ingredients/low-stock");
}

export async function createIngredient(
  input: CreateIngredientInput,
): Promise<Ingredient> {
  return api.post<Ingredient>("/ingredients", input);
}

export async function updateIngredient(
  ingredientId: string,
  input: UpdateIngredientInput,
): Promise<Ingredient> {
  return api.patch<Ingredient>(`/ingredients/${ingredientId}`, input);
}

export async function disableIngredient(
  ingredientId: string,
): Promise<Ingredient> {
  return api.delete<Ingredient>(`/ingredients/${ingredientId}`);
}

export async function getProductRecipe(
  productId: string,
): Promise<RecipeItem[]> {
  return api.get<RecipeItem[]>(`/products/${productId}/recipe`);
}

export async function setProductRecipe(
  productId: string,
  input: SetRecipeInput,
): Promise<RecipeItem[]> {
  return api.put<RecipeItem[]>(`/products/${productId}/recipe`, input);
}
