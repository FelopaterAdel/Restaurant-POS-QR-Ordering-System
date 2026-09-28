import { useQuery } from "@tanstack/react-query";
import { listCoupons } from "./coupons.api";

export const couponKeys = {
  all: ["coupons"] as const,
  lists: () => [...couponKeys.all, "list"] as const,
  list: () => [...couponKeys.lists()] as const,
};

export function useCouponsQuery() {
  return useQuery({
    queryKey: couponKeys.list(),
    queryFn: listCoupons,
  });
}
