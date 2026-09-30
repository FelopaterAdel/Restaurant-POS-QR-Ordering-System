import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal } from "@/components/ui";

const refundRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  reason: z
    .string()
    .trim()
    .max(500, "Reason must be at most 500 characters")
    .optional()
    .nullable(),
});

export interface RefundRequestValues {
  amount?: number;
  reason?: string | null;
}

export function RefundRequestModal({
  open,
  maxAmount,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  maxAmount: number;
  onClose: () => void;
  onSubmit: (values: RefundRequestValues) => void;
  isPending: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RefundRequestValues>({
    resolver: zodResolver(refundRequestSchema),
  });

  useEffect(() => {
    if (open) {
      reset({ amount: maxAmount });
    }
  }, [open, maxAmount, reset]);

  return (
    <Modal
      open={open}
      title="Request refund"
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
            {isPending ? "Sending…" : "Send request"}
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
          label={`Amount (max ${maxAmount})`}
          type="number"
          min={0}
          step="any"
          {...register("amount", { valueAsNumber: true })}
          error={errors.amount?.message}
        />
        <Input
          label="Reason (optional)"
          placeholder="Why is this refunded?"
          {...register("reason")}
          error={errors.reason?.message}
        />
      </form>
    </Modal>
  );
}
