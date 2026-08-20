import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  disableCategory,
  updateCategory,
} from "./categories.api";
import { categoryKeys } from "./categories.queries";
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.types";
import { productKeys } from "@/features/products/products.queries";

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      void queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCategoryInput;
    }) => updateCategory(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      void queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useDisableCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => disableCategory(categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      void queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
