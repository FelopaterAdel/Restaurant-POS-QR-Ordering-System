import { useEffect } from "react";
import { useRestaurantQuery } from "./settings.queries";
import { applyBranding, resetBranding } from "./theme-engine";
import { RestaurantContext, type RestaurantContextValue } from "./restaurant-context";

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const { data: restaurant, isLoading, error } = useRestaurantQuery();

  useEffect(() => {
    if (restaurant) {
      applyBranding({
        primaryColor: restaurant.primaryColor,
        secondaryColor: restaurant.secondaryColor,
      });
    }

    return () => {
      resetBranding();
    };
  }, [restaurant]);

  const value: RestaurantContextValue = {
    restaurant: restaurant ?? null,
    isLoading,
    error: error as Error | null,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}
