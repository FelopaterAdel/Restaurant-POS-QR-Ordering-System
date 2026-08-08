import { createHash } from "node:crypto";
import { prisma } from "@restaurant/database";
import type { PrismaClient } from "@restaurant/database";

export class RefreshTokenRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  static hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async create(userId: string, tokenHash: string, expiresAt: Date) {
    return this.client.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findByTokenHash(tokenHash: string) {
    return this.client.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async revoke(id: string) {
    return this.client.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllByUserId(userId: string) {
    return this.client.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
