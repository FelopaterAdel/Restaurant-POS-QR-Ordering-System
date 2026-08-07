import { prisma } from "@restaurant/database";
import type { PrismaClient, UserRole, UserStatus } from "@restaurant/database";

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
}

export class UserRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findById(id: string) {
    return this.client.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.client.user.findUnique({
      where: { email },
    });
  }

  async create(data: CreateUserInput) {
    return this.client.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role ?? "CASHIER",
        status: data.status ?? "ACTIVE",
      },
    });
  }

  async update(id: string, data: UpdateUserInput) {
    return this.client.user.update({
      where: { id },
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role,
        status: data.status,
      },
    });
  }

  async delete(id: string) {
    return this.client.user.update({
      where: { id },
      data: { status: "INACTIVE" },
    });
  }
}
