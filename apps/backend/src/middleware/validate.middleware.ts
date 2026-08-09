import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export type ValidateSource = "body" | "query" | "params";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResponse {
  success: boolean;
  errors?: ValidationError[];
}

/**
 * Express middleware to validate request data against a Zod schema
 * Automatically returns validation errors if data is invalid
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
        const errors: ValidationError[] = result.error.issues.map((issue) => ({
          field: issue.path.join(".") || "unknown",
          message: issue.message,
        }));

        return res.status(400).json({
          success: false,
          errors,
        } as ValidationResponse);
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
