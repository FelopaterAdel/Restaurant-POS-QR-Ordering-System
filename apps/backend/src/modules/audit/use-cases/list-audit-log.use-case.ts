import { AuditAction } from "@restaurant/database";
import { AuditRepository } from "../repositories/audit.repository.js";

export interface ListAuditLogInput {
  userId?: string;
  action?: AuditAction;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

function startOfDay(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function endOfDayExclusive(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1));
}

export class ListAuditLogUseCase {
  private readonly auditRepository: AuditRepository;

  constructor(auditRepository: AuditRepository = new AuditRepository()) {
    this.auditRepository = auditRepository;
  }

  async execute(input: ListAuditLogInput = {}) {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    const { items, total } = await this.auditRepository.findPage({
      userId: input.userId,
      action: input.action,
      from: input.from ? startOfDay(input.from) : undefined,
      to: input.to ? endOfDayExclusive(input.to) : undefined,
      page,
      limit,
    });

    return {
      data: items.map((item) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        details: item.details,
        createdAt: item.createdAt,
        user: item.user,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
