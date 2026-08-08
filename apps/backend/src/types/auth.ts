import type { UserRole, UserStatus } from "@restaurant/database";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}
