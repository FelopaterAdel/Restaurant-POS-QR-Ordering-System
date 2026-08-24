import { useQuery } from "@tanstack/react-query";
import { getOrderQueue } from "@/features/orders/orders.api";
import { orderKeys } from "@/features/orders/orders.queries";
import type { OrderQueueParams } from "@/features/orders/orders.types";

const READY_POLL_INTERVAL_MS = 10_000;
const READY_PAGE_SIZE = 50;

const READY_QUEUE_PARAMS: OrderQueueParams = {
  status: "READY",
  limit: READY_PAGE_SIZE,
};

export function useReadyOrdersQuery() {
  return useQuery({
    queryKey: orderKeys.queue(READY_QUEUE_PARAMS),
    queryFn: () => getOrderQueue(READY_QUEUE_PARAMS),
    refetchInterval: READY_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}
