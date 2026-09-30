import { z } from "zod";

export const reservationPhoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number looks too short")
  .max(20, "Phone number must be at most 20 characters")
  .regex(
    /^[+]?[0-9][0-9\s-]*$/,
    "Phone number may only contain digits, spaces, dashes and a leading +",
  );

export const createReservationSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Customer name is required")
    .max(100, "Customer name must be at most 100 characters"),
  phone: reservationPhoneSchema,
  partySize: z.coerce
    .number()
    .int("Party size must be an integer")
    .positive("Party size must be positive")
    .max(100, "Party size must be at most 100"),
  tableId: z.string().trim().min(1, "Table id is required"),
  reservedFor: z.coerce.date(),
});

export type CreateReservationDTO = z.infer<typeof createReservationSchema>;
export type CreateReservationInput = z.input<typeof createReservationSchema>;
