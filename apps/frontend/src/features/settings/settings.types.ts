export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRestaurantInput {
  name?: string;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string | null;
}
