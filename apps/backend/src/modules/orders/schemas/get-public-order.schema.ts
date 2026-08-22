import { z } from "zod";

export const getPublicOrderParamsSchema = z.object({
  orderId: z.string().trim().min(1, "Order id is required"),
});

export const getPublicOrderQuerySchema = z.object({
  qrCode: z.string().trim().min(1, "Qr code is required"),
});

export interface GetPublicOrderInput {
  orderId: string;
  qrCode: string;
}
