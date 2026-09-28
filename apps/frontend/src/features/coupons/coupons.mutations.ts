import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCoupon, disableCoupon, updateCoupon } from "./coupons.api";
import { couponKeys } from "./coupons.queries";
import type { CreateCouponInput, UpdateCouponInput } from "./coupons.types";

export function useCreateCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCouponInput) => createCoupon(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}

export function useUpdateCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCouponInput }) =>
      updateCoupon(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}

export function useDisableCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (couponId: string) => disableCoupon(couponId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}
