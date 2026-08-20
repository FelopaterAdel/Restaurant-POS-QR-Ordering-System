import { useQuery } from "@tanstack/react-query";
import { getProduct, listProducts } from "./products.api";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: () => [...productKeys.lists()] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (productId: string) =>
    [...productKeys.details(), productId] as const,
};

export function useProductsQuery() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: listProducts,
  });
}

export function useProductDetailQuery(productId: string) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => getProduct(productId),
    enabled: productId.length > 0,
  });
}
