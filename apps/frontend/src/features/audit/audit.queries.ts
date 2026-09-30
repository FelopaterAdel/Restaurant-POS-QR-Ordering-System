import { useQuery } from "@tanstack/react-query";
import { fetchAuditLog } from "./audit.api";
import type { AuditLogParams } from "./audit.types";

export const auditKeys = {
  all: ["audit-log"] as const,
  list: (params?: AuditLogParams) => [...auditKeys.all, "list", params] as const,
};

export function useAuditLogQuery(params?: AuditLogParams) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => fetchAuditLog(params),
  });
}
