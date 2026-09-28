import { useQuery } from "@tanstack/react-query";
import {
  getProductRecipe,
  listIngredients,
  listLowStock,
} from "./inventory.api";

const INVENTORY_POLL_INTERVAL_MS = 30_000;

export const ingredientKeys = {
  all: ["ingredients"] as const,
  lists: () => [...ingredientKeys.all, "list"] as const,
  list: () => [...ingredientKeys.lists()] as const,
  recipes: () => [...ingredientKeys.all, "recipe"] as const,
  recipe: (productId: string) =>
    [...ingredientKeys.recipes(), productId] as const,
};

export function useIngredientsQuery() {
  return useQuery({
    queryKey: ingredientKeys.list(),
    queryFn: listIngredients,
    refetchInterval: INVENTORY_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useLowStockQuery() {
  return useQuery({
    queryKey: [...ingredientKeys.all, "low-stock"] as const,
    queryFn: listLowStock,
    refetchInterval: INVENTORY_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useProductRecipeQuery(productId: string) {
  return useQuery({
    queryKey: ingredientKeys.recipe(productId),
    queryFn: () => getProductRecipe(productId),
    enabled: productId.length > 0,
  });
}
