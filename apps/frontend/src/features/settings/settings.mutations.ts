import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRestaurant } from "./settings.api";
import { restaurantKeys } from "./settings.queries";
import type { UpdateRestaurantInput } from "./settings.types";

export function useUpdateRestaurantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRestaurantInput) => updateRestaurant(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: restaurantKeys.all });
    },
  });
}
