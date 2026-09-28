import { api } from "@/lib/api";

export interface OnlinePaymentProvider {
  id: "stripe" | "paymob";
  label: string;
}

export async function listPublicPaymentProviders(): Promise<
  OnlinePaymentProvider[]
> {
  return api.get<OnlinePaymentProvider[]>("/public/payment-providers", {
    skipAuthRefresh: true,
  });
}
