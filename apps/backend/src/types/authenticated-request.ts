import type { Request } from "express";
import type { AuthenticatedUser } from "./auth.js";

export interface AuthenticatedRequest<
  P extends Record<string, unknown> = Record<string, unknown>,
> extends Request<P> {
  user: AuthenticatedUser;
}
