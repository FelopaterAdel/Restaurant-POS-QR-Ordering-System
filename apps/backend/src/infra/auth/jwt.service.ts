import { randomUUID } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "@restaurant/database";

export interface TokenPayload {
  sub: string;
  role: UserRole;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export class JWTService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: SignOptions["expiresIn"];
  private readonly refreshExpiresIn: SignOptions["expiresIn"];

  constructor(
    accessSecret: string,
    refreshSecret: string,
    accessExpiresIn: SignOptions["expiresIn"] = "15m",
    refreshExpiresIn: SignOptions["expiresIn"] = "7d",
  ) {
    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
    this.accessExpiresIn = accessExpiresIn;
    this.refreshExpiresIn = refreshExpiresIn;
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign({ ...payload, jti: randomUUID() }, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
    });
  }

  verifyAccessToken(token: string): DecodedToken | null {
    try {
      return jwt.verify(token, this.accessSecret) as DecodedToken;
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): DecodedToken | null {
    try {
      return jwt.verify(token, this.refreshSecret) as DecodedToken;
    } catch {
      return null;
    }
  }
}
