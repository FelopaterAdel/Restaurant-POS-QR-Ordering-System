import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createIngredient,
  disableIngredient,
  setProductRecipe,
  updateIngredient,
} from "./inventory.api";
import { ingredientKeys } from "./inventory.queries";
import type {
  CreateIngredientInput,
  SetRecipeInput,
  UpdateIngredientInput,
} from "./inventory.types";

export function useCreateIngredientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateIngredientInput) => createIngredient(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ingredientKeys.all });
    },
  });
}

export function useUpdateIngredientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateIngredientInput;
    }) => updateIngredient(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ingredientKeys.all });
    },
  });
}

export function useDisableIngredientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ingredientId: string) => disableIngredient(ingredientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ingredientKeys.all });
    },
  });
}

export function useSetProductRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: SetRecipeInput;
    }) => setProductRecipe(productId, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ingredientKeys.recipe(variables.productId),
      });
    },
  });
}
