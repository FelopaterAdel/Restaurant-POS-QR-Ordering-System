import { UserRole, UserStatus, type User } from "@restaurant/database";

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user_1",
    email: "cashier@example.com",
    name: "Cashier",
    password: "$2a$12$hashed-password-value",
    role: UserRole.CASHIER,
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
