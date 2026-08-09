import { z } from "zod";

export function idParamSchema(name = "id") {
  return z.object({
    [name]: z.string().trim().min(1, `${name} is required`),
  });
}

export const tableIdParamSchema = idParamSchema("tableId");
