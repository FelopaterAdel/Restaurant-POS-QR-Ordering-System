import { useQuery } from "@tanstack/react-query";
import { listPublicPaymentProviders } from "./providers.api";

export function usePublicPaymentProvidersQuery(enabled = true) {
  return useQuery({
    queryKey: ["public", "payment-providers"],
    queryFn: listPublicPaymentProviders,
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
