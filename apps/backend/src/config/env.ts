import { config } from "dotenv";
import type { SignOptions } from "jsonwebtoken";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

config({
  path: join(dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
] as const;

function assertRequiredEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter(
    (name) => !process.env[name] || process.env[name]?.trim() === "",
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Add them to apps/backend/.env or the running process environment.",
    );
  }
}

assertRequiredEnv();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ??
      "15m") as SignOptions["expiresIn"],
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
      "7d") as SignOptions["expiresIn"],
  },
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:3000",
  frontendBaseUrl: process.env.FRONTEND_BASE_URL ?? "http://localhost:5173",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  authRateLimit: {
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
    loginMax: Number(process.env.AUTH_RATE_LIMIT_LOGIN_MAX ?? 10),
    refreshMax: Number(process.env.AUTH_RATE_LIMIT_REFRESH_MAX ?? 30),
  },
  swaggerEnabled:
    process.env.SWAGGER_ENABLED === "true" ||
    (process.env.SWAGGER_ENABLED === undefined &&
      process.env.NODE_ENV !== "production"),
  loyalty: {
    amountPerPoint: Number(process.env.LOYALTY_AMOUNT_PER_POINT ?? 10),
    expiryMonths: Number(process.env.LOYALTY_POINT_EXPIRY_MONTHS ?? 12),
    silverThreshold: Number(process.env.LOYALTY_SILVER_THRESHOLD ?? 500),
    goldThreshold: Number(process.env.LOYALTY_GOLD_THRESHOLD ?? 2000),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    currency: process.env.STRIPE_CURRENCY ?? "egp",
  },
  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
  },
  reports: {
    cron: process.env.REPORT_CRON ?? "0 6 * * *",
  },
  paymob: {
    apiKey: process.env.PAYMOB_API_KEY ?? "",
    integrationId: process.env.PAYMOB_INTEGRATION_ID ?? "",
    iframeId: process.env.PAYMOB_IFRAME_ID ?? "",
    hmacSecret: process.env.PAYMOB_HMAC_SECRET ?? "",
    currency: process.env.PAYMOB_CURRENCY ?? "EGP",
  },
};
