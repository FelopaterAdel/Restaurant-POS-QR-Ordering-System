import { z } from "zod";
import { reservationPhoneSchema } from "./create-reservation.schema.js";

export const updateReservationSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Customer name is required")
    .max(100, "Customer name must be at most 100 characters")
    .optional(),
  phone: reservationPhoneSchema.optional(),
  partySize: z.coerce
    .number()
    .int("Party size must be an integer")
    .positive("Party size must be positive")
    .max(100, "Party size must be at most 100")
    .optional(),
  tableId: z.string().trim().min(1, "Table id is required").optional(),
  reservedFor: z.coerce.date().optional(),
});

export type UpdateReservationDTO = z.infer<typeof updateReservationSchema>;
