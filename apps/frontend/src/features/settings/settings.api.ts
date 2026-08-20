import { api } from "@/lib/api";
import type { Restaurant, UpdateRestaurantInput } from "./settings.types";

export async function getRestaurant(): Promise<Restaurant | null> {
  return api.get<Restaurant | null>("/restaurant");
}

export async function updateRestaurant(
  input: UpdateRestaurantInput,
): Promise<Restaurant> {
  return api.patch<Restaurant>("/restaurant", input);
}
