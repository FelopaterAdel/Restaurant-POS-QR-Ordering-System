import type { User, UserRole, UserStatus } from "@restaurant/database";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export interface AdminUser extends SafeUser {
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toAdminUser(user: User): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
