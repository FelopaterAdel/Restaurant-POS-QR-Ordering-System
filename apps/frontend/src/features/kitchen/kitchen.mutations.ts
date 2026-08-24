import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrderStatus } from "@/features/orders/orders.api";
import { orderKeys } from "@/features/orders/orders.queries";
import type { OrderStatus } from "@/components/ui";

export interface KitchenStatusInput {
  orderId: string;
  status: OrderStatus;
}

export function useKitchenStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: KitchenStatusInput) =>
      updateOrderStatus(orderId, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
