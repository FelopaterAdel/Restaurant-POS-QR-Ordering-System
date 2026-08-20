import { useQuery } from "@tanstack/react-query";
import { getRestaurant } from "./settings.api";

export const restaurantKeys = {
  all: ["restaurant"] as const,
  detail: () => [...restaurantKeys.all, "detail"] as const,
};

export function useRestaurantQuery() {
  return useQuery({
    queryKey: restaurantKeys.detail(),
    queryFn: getRestaurant,
  });
}
