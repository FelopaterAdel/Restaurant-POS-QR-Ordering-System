import { api } from "@/lib/api";
import type { AuditEntry, AuditLogParams } from "./audit.types";
import type { Pagination } from "@/types/pagination";

export interface AuditLogPage {
  data: AuditEntry[];
  pagination: Pagination;
}

export async function fetchAuditLog(
  params?: AuditLogParams,
): Promise<AuditLogPage> {
  return api.getPaginated<AuditEntry>("/audit-log", {
    params,
  });
}
