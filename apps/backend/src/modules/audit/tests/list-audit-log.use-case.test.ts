import { describe, expect, it, vi } from "vitest";
import { AuditRepository } from "../repositories/audit.repository.js";
import { ListAuditLogUseCase } from "../use-cases/list-audit-log.use-case.js";

describe("ListAuditLogUseCase", () => {
  it("returns paginated entries with computed total pages", async () => {
    const repository = {
      findPage: vi.fn().mockResolvedValue({
        items: [
          {
            id: "log_1",
            action: "REFUND_APPROVED",
            entityType: "REFUND",
            entityId: "ref_1",
            details: null,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            user: { id: "u1", name: "Manager", email: "m@test.com", role: "MANAGER" },
          },
        ],
        total: 45,
      }),
    } as unknown as AuditRepository;
    const useCase = new ListAuditLogUseCase(repository);

    const result = await useCase.execute({ page: 2, limit: 20 });

    expect(repository.findPage).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 20 }),
    );
    expect(result.pagination).toEqual({
      page: 2,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
    expect(result.data).toHaveLength(1);
  });

  it("passes user, action and date filters through", async () => {
    const repository = {
      findPage: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    } as unknown as AuditRepository;
    const useCase = new ListAuditLogUseCase(repository);

    await useCase.execute({
      userId: "u1",
      action: "ORDER_CANCELLED",
      from: "2026-09-01",
      to: "2026-09-28",
    });

    expect(repository.findPage).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        action: "ORDER_CANCELLED",
        from: new Date("2026-09-01T00:00:00.000Z"),
        to: new Date("2026-09-29T00:00:00.000Z"),
        page: 1,
        limit: 20,
      }),
    );
  });
});
