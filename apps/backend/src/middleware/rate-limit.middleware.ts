import type { NextFunction, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";

export interface RateLimitOptions {
  windowMs: number;
  limit: number;
}

function tooManyRequestsHandler(
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  res.status(429).json({
    success: false,
    message: "Too many requests, please try again later",
  });
}

export function rateLimiter(options: RateLimitOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: tooManyRequestsHandler,
  });
}
