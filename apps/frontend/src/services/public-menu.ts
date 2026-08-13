import { api } from "@/lib/api";

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface PublicCategory {
  id: string;
  name: string;
  products: PublicProduct[];
}

export interface PublicMenu {
  table: {
    id: string;
    number: number;
  };
  categories: PublicCategory[];
}

export async function getPublicMenu(qrCode: string): Promise<PublicMenu> {
  return api.get<PublicMenu>(`/public/tables/${qrCode}/menu`);
}
