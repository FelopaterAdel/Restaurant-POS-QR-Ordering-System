import { api } from "@/lib/api";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./categories.types";

export async function listCategories(): Promise<Category[]> {
  return api.get<Category[]>("/categories?all=true");
}

export async function getCategory(categoryId: string): Promise<Category> {
  return api.get<Category>(`/categories/${categoryId}`);
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<Category> {
  return api.post<Category>("/categories", input);
}

export async function updateCategory(
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<Category> {
  return api.patch<Category>(`/categories/${categoryId}`, input);
}

export async function disableCategory(categoryId: string): Promise<Category> {
  return api.delete<Category>(`/categories/${categoryId}`);
}
