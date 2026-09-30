import type { AuditAction } from "@restaurant/database";
import { AuditRepository } from "../repositories/audit.repository.js";

export interface RecordAuditInput {
  userId?: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  details?: unknown;
}

/**
 * Best-effort audit trail writer. Audit entries must never break the
 * business flow they describe, so callers should catch and log failures.
 */
export class AuditService {
  private readonly auditRepository: AuditRepository;

  constructor(auditRepository: AuditRepository = new AuditRepository()) {
    this.auditRepository = auditRepository;
  }

  async record(input: RecordAuditInput): Promise<void> {
    try {
      await this.auditRepository.create(input);
    } catch (error) {
      console.error("Failed to record audit log", error);
    }
  }
}
