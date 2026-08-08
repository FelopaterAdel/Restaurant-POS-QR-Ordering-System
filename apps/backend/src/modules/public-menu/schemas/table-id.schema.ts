import { z } from "zod";

export const tableIdSchema = z.object({
  tableId: z.string().trim().min(1, "Table id is required"),
});

export type TableIdDTO = z.infer<typeof tableIdSchema>;
export type TableIdInput = z.input<typeof tableIdSchema>;
