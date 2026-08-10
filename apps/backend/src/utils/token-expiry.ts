import type { SignOptions } from "jsonwebtoken";

export function calculateRefreshExpiry(
  expiresIn: SignOptions["expiresIn"] = "7d",
): Date {
  const value = Number.parseInt(String(expiresIn), 10);
  const unit = String(expiresIn).replace(/[0-9]/g, "");

  const now = Date.now();
  switch (unit) {
    case "s":
      return new Date(now + value * 1000);
    case "m":
      return new Date(now + value * 60 * 1000);
    case "h":
      return new Date(now + value * 60 * 60 * 1000);
    case "d":
      return new Date(now + value * 24 * 60 * 60 * 1000);
    default:
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }
}
