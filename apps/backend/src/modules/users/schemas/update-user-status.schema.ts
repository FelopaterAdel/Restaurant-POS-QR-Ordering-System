import { z } from "zod";
import { UserStatus } from "@restaurant/database";

const userStatusValues = Object.values(UserStatus) as [
  (typeof UserStatus)[keyof typeof UserStatus],
  ...(typeof UserStatus)[keyof typeof UserStatus][],
];

export const updateUserStatusSchema = z.object({
  status: z.enum(userStatusValues),
});

export type UpdateUserStatusDTO = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserStatusInput = z.input<typeof updateUserStatusSchema>;
