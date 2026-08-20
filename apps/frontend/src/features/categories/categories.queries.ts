import { useQuery } from "@tanstack/react-query";
import { getCategory, listCategories } from "./categories.api";

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: () => [...categoryKeys.lists()] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (categoryId: string) =>
    [...categoryKeys.details(), categoryId] as const,
};

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: listCategories,
  });
}

export function useCategoryDetailQuery(categoryId: string) {
  return useQuery({
    queryKey: categoryKeys.detail(categoryId),
    queryFn: () => getCategory(categoryId),
    enabled: categoryId.length > 0,
  });
}
