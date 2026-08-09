import type { NextFunction, RequestHandler, Response } from "express";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../errors/app-error.js";
import { JWTService } from "../infra/auth/jwt.service.js";
import { UserRepository } from "../modules/users/repositories/user.repository.js";
import type { AuthenticatedUser } from "../types/auth.js";
import type { AuthenticatedRequest } from "../types/authenticated-request.js";

export interface AuthMiddlewareOptions {
  userRepository?: UserRepository;
  jwtService?: JWTService;
}

const defaultJwtService = new JWTService(
  env.jwt.accessSecret,
  env.jwt.refreshSecret,
  env.jwt.accessExpiresIn,
  env.jwt.refreshExpiresIn,
);

function toAuthenticatedUser(user: {
  id: string;
  name: string;
  email: string;
  role: AuthenticatedUser["role"];
  status: AuthenticatedUser["status"];
}): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export function authMiddleware(
  options: AuthMiddlewareOptions = {},
): RequestHandler {
  const userRepository = options.userRepository ?? new UserRepository();
  const jwtService = options.jwtService ?? defaultJwtService;

  const handler = async function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authorization = req.headers.authorization;
      if (!authorization?.startsWith("Bearer ")) {
        return next(new UnauthorizedError("No access token provided"));
      }

      const token = authorization.slice("Bearer ".length).trim();
      const decoded = jwtService.verifyAccessToken(token);
      if (!decoded?.sub) {
        return next(
          new UnauthorizedError("Invalid or expired access token"),
        );
      }

      const user = await userRepository.findById(decoded.sub);
      if (!user) {
        return next(new UnauthorizedError("User not found"));
      }

      if (user.status !== "ACTIVE") {
        return next(new UnauthorizedError("Account is not active"));
      }

      req.user = toAuthenticatedUser(user);

      next();
    } catch (error) {
      next(error);
    }
  };

  return handler as RequestHandler;
}
