import { z } from "zod";

export const qrCodeSchema = z.object({
  qrCode: z.string().trim().min(1, "Qr code is required"),
});

export type QrCodeDTO = z.infer<typeof qrCodeSchema>;
export type QrCodeInput = z.input<typeof qrCodeSchema>;
