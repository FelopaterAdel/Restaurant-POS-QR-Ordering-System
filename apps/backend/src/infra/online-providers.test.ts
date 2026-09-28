import { describe, expect, it } from "vitest";
import {
  listConfiguredProviders,
  resolveOnlineProvider,
  type OnlineProviderMap,
} from "./online-providers.js";

function stubProviders(configured: {
  stripe: boolean;
  paymob: boolean;
}): OnlineProviderMap {
  return {
    stripe: {
      name: "stripe",
      isConfigured: () => configured.stripe,
      createPaymentIntent: async () => ({ id: "x", clientSecret: "y" }),
    },
    paymob: {
      name: "paymob",
      isConfigured: () => configured.paymob,
      createPaymentIntent: async () => ({ id: "x", clientSecret: "y" }),
    },
  };
}

describe("resolveOnlineProvider", () => {
  it("honours an explicit configured choice", () => {
    const providers = stubProviders({ stripe: true, paymob: true });
    expect(resolveOnlineProvider("paymob", providers)?.name).toBe("paymob");
  });

  it("rejects an explicit unconfigured choice", () => {
    const providers = stubProviders({ stripe: true, paymob: false });
    expect(resolveOnlineProvider("paymob", providers)).toBeNull();
  });

  it("prefers stripe by default, then paymob, then null", () => {
    expect(
      resolveOnlineProvider(undefined, stubProviders({ stripe: true, paymob: true }))?.name,
    ).toBe("stripe");
    expect(
      resolveOnlineProvider(undefined, stubProviders({ stripe: false, paymob: true }))?.name,
    ).toBe("paymob");
    expect(
      resolveOnlineProvider(undefined, stubProviders({ stripe: false, paymob: false })),
    ).toBeNull();
  });
});

describe("listConfiguredProviders", () => {
  it("lists only configured providers with labels", () => {
    expect(
      listConfiguredProviders(stubProviders({ stripe: false, paymob: true })),
    ).toEqual([{ id: "paymob", label: "Card / Wallet (Paymob)" }]);
    expect(
      listConfiguredProviders(stubProviders({ stripe: false, paymob: false })),
    ).toEqual([]);
  });
});
