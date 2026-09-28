import { PaymobPaymentService } from "./paymob/paymob.service.js";
import {
  StripePaymentService,
  type OnlinePaymentProvider,
} from "./stripe/stripe.service.js";

export type OnlineProviderName = "stripe" | "paymob";

export type OnlineProviderMap = Record<
  OnlineProviderName,
  OnlinePaymentProvider
>;

export function defaultOnlineProviders(): OnlineProviderMap {
  return {
    stripe: new StripePaymentService(),
    paymob: new PaymobPaymentService(),
  };
}

export interface OnlineProviderInfo {
  id: OnlineProviderName;
  label: string;
}

/** Providers a customer can actually pay with right now. */
export function listConfiguredProviders(
  providers: OnlineProviderMap,
): OnlineProviderInfo[] {
  const labels: Record<OnlineProviderName, string> = {
    stripe: "Card (Stripe)",
    paymob: "Card / Wallet (Paymob)",
  };
  return (Object.keys(providers) as OnlineProviderName[])
    .filter((name) => providers[name].isConfigured())
    .map((name) => ({ id: name, label: labels[name] }));
}

/**
 * Explicit choice wins; otherwise the first configured provider.
 * Returns null when nothing is configured.
 */
export function resolveOnlineProvider(
  name: OnlineProviderName | undefined,
  providers: OnlineProviderMap,
): OnlinePaymentProvider | null {
  if (name) {
    const provider = providers[name];
    return provider && provider.isConfigured() ? provider : null;
  }
  if (providers.stripe.isConfigured()) {
    return providers.stripe;
  }
  if (providers.paymob.isConfigured()) {
    return providers.paymob;
  }
  return null;
}
