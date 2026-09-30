import { z } from "zod";

export const updateReservationStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "SEATED", "CANCELLED", "COMPLETED"]),
});

export type UpdateReservationStatusDTO = z.infer<
  typeof updateReservationStatusSchema
>;
