import { RefreshTokenRepository } from "../repositories/refresh-token.repository.js";
import {
  refreshTokenSchema,
  type RefreshTokenDTO,
} from "../schemas/refresh-token.schema.js";

export class LogoutUseCase {
  private readonly refreshTokenRepository: RefreshTokenRepository;

  constructor(
    refreshTokenRepository: RefreshTokenRepository = new RefreshTokenRepository(),
  ) {
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async execute(input: RefreshTokenDTO): Promise<void> {
    const { refreshToken } = refreshTokenSchema.parse(input);

    const tokenHash = RefreshTokenRepository.hashToken(refreshToken);

    const storedToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);
    if (!storedToken || storedToken.revokedAt) {
      return;
    }

    await this.refreshTokenRepository.revoke(storedToken.id);
  }
}
