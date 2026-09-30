import { z } from "zod";

export const listRefundsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
});

export type ListRefundsQueryDTO = z.infer<typeof listRefundsQuerySchema>;
