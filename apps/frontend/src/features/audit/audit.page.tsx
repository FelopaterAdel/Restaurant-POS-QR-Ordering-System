import { useState } from "react";
import {
  Button,
  EmptyState,
  ErrorState,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { useStaffQuery } from "@/features/users/users.queries";
import { useAuditLogQuery } from "./audit.queries";
import type { AuditAction } from "./audit.types";
import "./audit.css";

const ACTIONS: AuditAction[] = [
  "REFUND_REQUESTED",
  "REFUND_APPROVED",
  "REFUND_REJECTED",
  "PAYMENT_VOIDED",
  "DISCOUNT_APPLIED",
  "STOCK_ADJUSTED",
  "ORDER_CANCELLED",
];

const PAGE_SIZE = 20;

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function AuditPage() {
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState<AuditAction | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useAuditLogQuery({
    userId: userId || undefined,
    action: action || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const { data: staff } = useStaffQuery();

  function updateFilters(patch: {
    userId?: string;
    action?: AuditAction | "";
    from?: string;
    to?: string;
  }) {
    if (patch.userId !== undefined) setUserId(patch.userId);
    if (patch.action !== undefined) setAction(patch.action);
    if (patch.from !== undefined) setFrom(patch.from);
    if (patch.to !== undefined) setTo(patch.to);
    setPage(1);
  }

  const entries = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="audit">
      <h1 className="audit__title">Audit Log</h1>

      <div className="audit__filters">
        <label>
          User
          <select
            aria-label="Filter by user"
            value={userId}
            onChange={(e) => updateFilters({ userId: e.target.value })}
          >
            <option value="">All users</option>
            {(staff ?? []).map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.role})
              </option>
            ))}
          </select>
        </label>
        <label>
          Action
          <select
            aria-label="Filter by action"
            value={action}
            onChange={(e) =>
              updateFilters({ action: e.target.value as AuditAction | "" })
            }
          >
            <option value="">All actions</option>
            {ACTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input
            type="date"
            aria-label="From date"
            value={from}
            onChange={(e) => updateFilters({ from: e.target.value })}
          />
        </label>
        <label>
          To
          <input
            type="date"
            aria-label="To date"
            value={to}
            onChange={(e) => updateFilters({ to: e.target.value })}
          />
        </label>
      </div>

      {isLoading ? (
        <p>Loading audit log…</p>
      ) : error ? (
        <ErrorState
          title="Failed to load audit log"
          description={error.message}
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      ) : entries.length === 0 ? (
        <EmptyState
          title="No audit entries"
          description="Sensitive actions will show up here."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Time</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Entity</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                  <TableCell>{entry.action}</TableCell>
                  <TableCell>
                    {entry.user
                      ? `${entry.user.name} (${entry.user.role})`
                      : "System"}
                  </TableCell>

                  <TableCell>
                    {entry.entityType && entry.entityId
                      ? `${entry.entityType} ${entry.entityId.slice(0, 8)}`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pagination && pagination.totalPages > 1 && (
            <div className="audit__pagination">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= pagination.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
