import { createContext, useContext } from "react";
import type { Restaurant } from "./settings.types";

export interface RestaurantContextValue {
  restaurant: Restaurant | null;
  isLoading: boolean;
  error: Error | null;
}

export const RestaurantContext = createContext<RestaurantContextValue | null>(
  null,
);

export function useRestaurant(): RestaurantContextValue {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}
