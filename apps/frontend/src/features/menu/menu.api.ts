import { api } from "@/lib/api";
import type {
  CreatePublicOrderInput,
  CreatePublicOrderResult,
  PublicMenu,
} from "./menu.types";

export async function getPublicMenu(qrCode: string): Promise<PublicMenu> {
  return api.get<PublicMenu>(`/public/tables/${qrCode}/menu`, {
    skipAuthRefresh: true,
  });
}

export async function createPublicOrder(
  input: CreatePublicOrderInput,
): Promise<CreatePublicOrderResult> {
  return api.post<CreatePublicOrderResult>("/public/orders", input, {
    skipAuthRefresh: true,
  });
}
