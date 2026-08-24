import { useQuery } from "@tanstack/react-query";
import { getOrderQueue } from "@/features/orders/orders.api";
import { orderKeys } from "@/features/orders/orders.queries";
import type { OrderQueueParams } from "@/features/orders/orders.types";

const KDS_POLL_INTERVAL_MS = 10_000;
const KDS_PAGE_SIZE = 50;

const KDS_QUEUE_PARAMS: OrderQueueParams = { limit: KDS_PAGE_SIZE };

export function useKitchenOrdersQuery() {
  return useQuery({
    queryKey: orderKeys.queue(KDS_QUEUE_PARAMS),
    queryFn: () => getOrderQueue(KDS_QUEUE_PARAMS),
    refetchInterval: KDS_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}
