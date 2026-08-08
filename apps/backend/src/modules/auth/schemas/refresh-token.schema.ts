import { z } from "zod";

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;
export type RefreshTokenInput = z.input<typeof refreshTokenSchema>;
