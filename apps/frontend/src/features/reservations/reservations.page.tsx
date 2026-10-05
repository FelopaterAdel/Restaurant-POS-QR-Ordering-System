import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { useTablesQuery } from "@/features/tables/tables.queries";
import { getApiErrorMessage } from "@/lib/api";
import { useReservationsQuery } from "./reservations.queries";
import {
  useCancelReservationMutation,
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useUpdateReservationStatusMutation,
} from "./reservations.mutations";
import type {
  Reservation,
  ReservationStatus,
} from "./reservations.types";
import "./reservations.css";

const reservationFormSchema = z.object({
  customerName: z.string().trim().min(1, "Name is required").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Phone looks too short")
    .max(20)
    .regex(
      /^[+]?[0-9][0-9\s-]*$/,
      "Digits, spaces, dashes and a leading + only",
    ),
  partySize: z.number().int().positive().max(100),
  tableId: z.string().min(1, "Table is required"),
  reservedFor: z.string().min(1, "Date and time are required"),
});

type ReservationFormValues = z.infer<typeof reservationFormSchema>;

const NEXT_ACTIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SEATED", "CANCELLED"],
  SEATED: ["COMPLETED"],
  CANCELLED: [],
  COMPLETED: [],
};

/** Local calendar day — matches what the user sees on their clock
 *  (toISOString would be UTC and off by one in the evening). */
function todayLocalString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** UTC calendar day of a stored reservation — matches the backend day
 *  bucket, so jumping the date filter to it always shows the item. */
function utcDayOf(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value.slice(0, 10)
    : date.toISOString().slice(0, 10);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function ReservationsPage() {
  const [date, setDate] = useState(() => todayLocalString());
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useReservationsQuery(date || undefined);
  const { data: tables } = useTablesQuery();

  const createMutation = useCreateReservationMutation();
  const updateMutation = useUpdateReservationMutation();
  const statusMutation = useUpdateReservationStatusMutation();
  const cancelMutation = useCancelReservationMutation();

  const activeTables = (tables ?? []).filter((t) => t.status !== "DISABLED");

  function closeModals() {
    setAddOpen(false);
    setEditing(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function handleDateChange(value: string) {
    setDate(value);
    setNotice(null);
  }

  if (isLoading) {
    return (
      <div>
        <h1>Reservations</h1>
        <p>Loading reservations…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Reservations</h1>
        <ErrorState
          title="Failed to load reservations"
          description={error.message}
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      </div>
    );
  }

  return (
    <div className="reservations">
      <div className="reservations__header">
        <div className="reservations__title-wrap">
          <h1 className="reservations__title">Reservations</h1>
          <p className="reservations__subtitle">
            {data ? `${data.length} reservation${data.length === 1 ? "" : "s"} · ` : ""}
            {date || "Pick a day"}
          </p>
        </div>
        <div className="reservations__filters">
          <input
            type="date"
            aria-label="Reservation date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
          />
          <Button onClick={() => setAddOpen(true)}>+ New reservation</Button>
        </div>
      </div>

      {notice && (
        <div className="reservations__notice" role="status">
          <span>{notice}</span>
          <button
            type="button"
            className="reservations__notice-dismiss"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {!data || data.length === 0 ? (
        <EmptyState
          title="No reservations for this day"
          description="Create one to hold a table for a customer."
          action={
            <Button onClick={() => setAddOpen(true)}>
              New reservation
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Time</TableHeaderCell>
              <TableHeaderCell>Customer</TableHeaderCell>
              <TableHeaderCell>Table</TableHeaderCell>
              <TableHeaderCell>Party</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell>{formatDateTime(reservation.reservedFor)}</TableCell>
                <TableCell>
                  {reservation.customerName}
                  <br />
                  <span className="reservations__phone">
                    {reservation.phone}
                  </span>
                </TableCell>
                <TableCell>
                  {reservation.table
                    ? `Table ${reservation.table.number}`
                    : reservation.tableId}
                </TableCell>
                <TableCell>{reservation.partySize}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      reservation.status === "CANCELLED"
                        ? "danger"
                        : reservation.status === "COMPLETED"
                          ? "success"
                          : reservation.status === "SEATED"
                            ? "info"
                            : "warning"
                    }
                  >
                    {reservation.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="reservations__row-actions">
                    {(reservation.status === "PENDING" ||
                      reservation.status === "CONFIRMED") && (
                      <Button
                        variant="outline"
                        onClick={() => setEditing(reservation)}
                      >
                        Edit
                      </Button>
                    )}
                    {NEXT_ACTIONS[reservation.status]
                      .filter((action) => action !== "CANCELLED")
                      .map((action) => (
                        <Button
                          key={action}
                          variant="outline"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({
                              id: reservation.id,
                              status: action,
                            })
                          }
                        >
                          {action === "CONFIRMED"
                            ? "Confirm"
                            : action === "SEATED"
                              ? "Seat"
                              : "Complete"}
                        </Button>
                      ))}
                    {(reservation.status === "PENDING" ||
                      reservation.status === "CONFIRMED") && (
                      <Button
                        variant="outline"
                        disabled={cancelMutation.isPending}
                        onClick={() =>
                          cancelMutation.mutate(reservation.id)
                        }
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ReservationModal
        open={addOpen}
        title="New reservation"
        submitLabel={createMutation.isPending ? "Creating…" : "Create"}
        isPending={createMutation.isPending}
        tables={activeTables}
        onClose={closeModals}
        error={
          createMutation.error
            ? getApiErrorMessage(createMutation.error)
            : null
        }
        onSubmit={(values) =>
          createMutation.mutate(values, {
            onSuccess: (created) => {
              const day = utcDayOf(created.reservedFor);
              setDate(day);
              setNotice(
                `Reservation for ${created.customerName} saved — showing ${day}.`,
              );
              closeModals();
            },
          })
        }
      />
      <ReservationModal
        open={editing !== null}
        title="Edit reservation"
        submitLabel={updateMutation.isPending ? "Saving…" : "Save"}
        isPending={updateMutation.isPending}
        tables={activeTables}
        initial={editing}
        onClose={closeModals}
        error={
          updateMutation.error
            ? getApiErrorMessage(updateMutation.error)
            : null
        }
        onSubmit={(values) => {
          if (!editing) return;
          updateMutation.mutate(
            { id: editing.id, data: values },
            {
              onSuccess: (saved) => {
                const day = utcDayOf(saved.reservedFor);
                setDate(day);
                setNotice(`Reservation updated — showing ${day}.`);
                closeModals();
              },
            },
          );
        }}
      />
    </div>
  );
}

function ReservationModal({
  open,
  title,
  submitLabel,
  isPending,
  tables,
  initial,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  isPending: boolean;
  tables: Array<{ id: string; number: number; name: string }>;
  initial?: Reservation | null;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: ReservationFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      partySize: 2,
      tableId: "",
      reservedFor: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        customerName: initial?.customerName ?? "",
        phone: initial?.phone ?? "",
        partySize: initial?.partySize ?? 2,
        tableId: initial?.tableId ?? "",
        reservedFor: initial
          ? new Date(initial.reservedFor).toISOString().slice(0, 16)
          : "",
      });
    }
  }, [open, initial, reset]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <div>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit(onSubmit)()}
            disabled={isPending}
          >
            {submitLabel}
          </Button>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(onSubmit)(e);
        }}
      >
        <Input
          label="Customer name"
          placeholder="e.g. Ahmed Samy"
          {...register("customerName")}
          error={errors.customerName?.message}
        />
        <Input
          label="Phone"
          placeholder="e.g. 01012345678"
          {...register("phone")}
          error={errors.phone?.message}
        />
        <Input
          label="Party size"
          type="number"
          min={1}
          max={100}
          step={1}
          {...register("partySize", { valueAsNumber: true })}
          error={errors.partySize?.message}
        />
        <label>
          Table
          <select {...register("tableId")}>
            <option value="">Select a table…</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                Table {table.number} — {table.name}
              </option>
            ))}
          </select>
          {errors.tableId?.message && <span>{errors.tableId.message}</span>}
        </label>
        <Input
          label="Date and time"
          type="datetime-local"
          {...register("reservedFor")}
          error={errors.reservedFor?.message}
        />
        {error && (
          <p className="reservations__form-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
