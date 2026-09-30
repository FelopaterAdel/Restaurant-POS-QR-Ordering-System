import { prisma } from "@restaurant/database";
import type { AuditAction, Prisma, PrismaClient } from "@restaurant/database";

export interface CreateAuditInput {
  userId?: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  details?: unknown;
}

export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export class AuditRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async create(data: CreateAuditInput) {
    return this.client.auditLog.create({
      data: {
        userId: data.userId ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details ?? undefined,
      },
    });
  }

  async findPage(filter: AuditLogFilter) {
    const where: Prisma.AuditLogWhereInput = {
      ...(filter.userId ? { userId: filter.userId } : {}),
      ...(filter.action ? { action: filter.action } : {}),
      ...(filter.from || filter.to
        ? {
            createdAt: {
              ...(filter.from ? { gte: filter.from } : {}),
              ...(filter.to ? { lt: filter.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.client.$transaction([
      this.client.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.client.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}
