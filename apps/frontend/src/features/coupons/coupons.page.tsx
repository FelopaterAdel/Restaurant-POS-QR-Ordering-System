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
import { useAuth } from "@/features/auth/use-auth";
import { useCouponsQuery } from "./coupons.queries";
import {
  useCreateCouponMutation,
  useDisableCouponMutation,
  useUpdateCouponMutation,
} from "./coupons.mutations";
import type { Coupon, CouponDiscountType } from "./coupons.types";
import "./coupons.css";

const couponFormSchema = z
  .object({
    code: z.string().trim().min(1, "Code is required").max(32),
    discountType: z.enum(["PERCENT", "FIXED"]),
    value: z.number().positive("Value must be positive"),
    expiresAt: z.string().optional().nullable(),
    maxUses: z.number().int().positive().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === "PERCENT" && data.value > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percent value must be at most 100",
      });
    }
  });

type CouponFormValues = z.infer<typeof couponFormSchema>;

function formatValue(coupon: Coupon): string {
  const value = Number(coupon.value);
  return coupon.discountType === "PERCENT" ? `${value}%` : `${value} EGP`;
}

function formatExpiry(coupon: Coupon): string {
  if (!coupon.expiresAt) return "Never";
  return new Date(coupon.expiresAt).toLocaleDateString();
}

export default function CouponsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER" || user?.role === "MANAGER";

  const { data, isLoading, error, refetch } = useCouponsQuery();
  const createMutation = useCreateCouponMutation();
  const updateMutation = useUpdateCouponMutation();
  const disableMutation = useDisableCouponMutation();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  function closeModals() {
    setAddOpen(false);
    setEditing(null);
  }

  if (isLoading) {
    return (
      <div>
        <h1>Coupons</h1>
        <p>Loading coupons…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Coupons</h1>
        <ErrorState
          title="Failed to load coupons"
          description={error.message}
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      </div>
    );
  }

  return (
    <div className="coupons">
      <div className="coupons__header">
        <h1 className="coupons__title">Coupons</h1>
        {canManage && (
          <Button onClick={() => setAddOpen(true)}>+ Add coupon</Button>
        )}
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          title="No coupons yet"
          description="Create a discount code customers can apply at checkout."
          action={
            canManage ? (
              <Button onClick={() => setAddOpen(true)}>Add coupon</Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Code</TableHeaderCell>
              <TableHeaderCell>Discount</TableHeaderCell>
              <TableHeaderCell>Expires</TableHeaderCell>
              <TableHeaderCell>Uses</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              {canManage && <TableHeaderCell>Actions</TableHeaderCell>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell>{coupon.code}</TableCell>
                <TableCell>{formatValue(coupon)}</TableCell>
                <TableCell>{formatExpiry(coupon)}</TableCell>
                <TableCell>
                  {coupon.usedCount}
                  {coupon.maxUses !== null ? ` / ${coupon.maxUses}` : ""}
                </TableCell>
                <TableCell>
                  <Badge variant={coupon.isActive ? "success" : "neutral"}>
                    {coupon.isActive ? "Active" : "Disabled"}
                  </Badge>
                </TableCell>
                {canManage && (
                  <TableCell>
                    <div className="coupons__row-actions">
                      <Button
                        variant="outline"
                        onClick={() => setEditing(coupon)}
                      >
                        Edit
                      </Button>
                      {coupon.isActive && (
                        <Button
                          variant="outline"
                          disabled={disableMutation.isPending}
                          onClick={() => disableMutation.mutate(coupon.id)}
                        >
                          Disable
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CouponModal
        open={addOpen}
        title="Add coupon"
        submitLabel={createMutation.isPending ? "Creating…" : "Create"}
        isPending={createMutation.isPending}
        onClose={closeModals}
        onSubmit={(values) =>
          createMutation.mutate(
            {
              ...values,
              expiresAt: values.expiresAt || null,
              maxUses: values.maxUses ?? null,
            },
            { onSuccess: closeModals },
          )
        }
      />
      <CouponModal
        open={editing !== null}
        title="Edit coupon"
        submitLabel={updateMutation.isPending ? "Saving…" : "Save"}
        isPending={updateMutation.isPending}
        initial={editing}
        onClose={closeModals}
        onSubmit={(values) => {
          if (!editing) return;
          updateMutation.mutate(
            {
              id: editing.id,
              data: {
                ...values,
                expiresAt: values.expiresAt || null,
                maxUses: values.maxUses ?? null,
              },
            },
            { onSuccess: closeModals },
          );
        }}
      />
    </div>
  );
}

function CouponModal({
  open,
  title,
  submitLabel,
  isPending,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  isPending: boolean;
  initial?: Coupon | null;
  onClose: () => void;
  onSubmit: (values: CouponFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      discountType: "PERCENT",
      value: 10,
      expiresAt: "",
      maxUses: undefined,
    },
  });

  const discountType: CouponDiscountType = watch("discountType");

  useEffect(() => {
    if (open) {
      reset({
        code: initial?.code ?? "",
        discountType: initial?.discountType ?? "PERCENT",
        value: initial ? Number(initial.value) : 10,
        expiresAt: initial?.expiresAt
          ? initial.expiresAt.slice(0, 16)
          : "",
        maxUses: initial?.maxUses ?? undefined,
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
          label="Code"
          placeholder="e.g. WELCOME10"
          {...register("code")}
          error={errors.code?.message}
        />
        <label>
          Discount type
          <select {...register("discountType")}>
            <option value="PERCENT">Percent (%)</option>
            <option value="FIXED">Fixed amount (EGP)</option>
          </select>
        </label>
        <Input
          label={discountType === "PERCENT" ? "Percent (1–100)" : "Amount (EGP)"}
          type="number"
          min={0}
          step="any"
          {...register("value", { valueAsNumber: true })}
          error={errors.value?.message}
        />
        <Input
          label="Expires at (optional)"
          type="datetime-local"
          {...register("expiresAt")}
          error={errors.expiresAt?.message}
        />
        <Input
          label="Max uses (optional)"
          type="number"
          min={1}
          step={1}
          {...register("maxUses", {
            setValueAs: (v) =>
              v === "" || v === null || Number.isNaN(Number(v))
                ? undefined
                : Number(v),
          })}
          error={errors.maxUses?.message}
        />
      </form>
    </Modal>
  );
}
