import type { Category } from "@/features/categories/categories.types";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isDeleted: boolean;
  categoryId: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  categoryId: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
}

export interface UpdateProductInput {
  name?: string;
  categoryId?: string;
  description?: string | null;
  price?: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
}
