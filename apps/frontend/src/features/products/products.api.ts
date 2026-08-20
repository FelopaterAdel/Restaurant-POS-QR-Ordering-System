import { api } from "@/lib/api";
import type {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from "./products.types";

export async function listProducts(): Promise<Product[]> {
  return api.get<Product[]>("/products?all=true");
}

export async function getProduct(productId: string): Promise<Product> {
  return api.get<Product>(`/products/${productId}`);
}

export async function createProduct(
  input: CreateProductInput,
): Promise<Product> {
  return api.post<Product>("/products", input);
}

export async function updateProduct(
  productId: string,
  input: UpdateProductInput,
): Promise<Product> {
  return api.patch<Product>(`/products/${productId}`, input);
}

export async function disableProduct(productId: string): Promise<Product> {
  return api.delete<Product>(`/products/${productId}`);
}
