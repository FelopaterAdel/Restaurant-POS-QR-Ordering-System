import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import {
  ValidationError,
  type ValidationIssue,
} from "../errors/app-error.js";

export type ValidateSource = "body" | "query" | "params";

/**
 * Express middleware to validate request data against a Zod schema
 * Fails with a 400 VALIDATION_ERROR through the global error handler.
 *
 * @param schema Zod schema to validate against
 * @param source Where to validate from: 'body', 'query', or 'params'
 * @returns Express middleware function
 *
 * @example
 * router.post('/bootstrap/owner', validate(bootstrapOwnerSchema, 'body'), controller.bootstrapOwner);
 */
export function validate(schema: ZodSchema, source: ValidateSource = "body") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[source];

      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
          field: issue.path.join(".") || "unknown",
          message: issue.message,
        }));

        return next(new ValidationError("Validation failed", issues));
      }

      // Replace the request data with validated data
      if (source === "query") {
        // In Express 5, req.query is a getter-only property, so shadow it
        // with an own property holding the validated query.
        Object.defineProperty(req, "query", {
          value: result.data,
          configurable: true,
          enumerable: true,
          writable: true,
        });
      } else {
        req[source] = result.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
