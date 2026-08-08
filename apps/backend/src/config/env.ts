import { config } from "dotenv";
import type { SignOptions } from "jsonwebtoken";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

config({
  path: join(dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "",
    accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ??
      "15m") as SignOptions["expiresIn"],
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
      "7d") as SignOptions["expiresIn"],
  },
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
};
