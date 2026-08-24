import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrderStatus } from "@/features/orders/orders.api";
import { orderKeys } from "@/features/orders/orders.queries";
import type { OrderStatus } from "@/components/ui";

export interface WaiterStatusInput {
  orderId: string;
  status: OrderStatus;
}

export function useWaiterStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: WaiterStatusInput) =>
      updateOrderStatus(orderId, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
