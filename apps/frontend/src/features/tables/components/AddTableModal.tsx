import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal } from "@/components/ui";
import { ApiError, getApiErrorMessage } from "@/lib/api";

const addTableSchema = z.object({
  number: z
    .number({ message: "Table number is required" })
    .int("Table number must be an integer")
    .positive("Table number must be positive"),
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
});

type AddTableFormValues = z.infer<typeof addTableSchema>;

export interface AddTableModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddTableFormValues) => void;
  isPending: boolean;
  error?: unknown;
}

export function AddTableModal({
  open,
  onClose,
  onSubmit,
  isPending,
  error,
}: AddTableModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddTableFormValues>({
    resolver: zodResolver(addTableSchema),
  });

  useEffect(() => {
    if (error instanceof ApiError && error.code === "TABLE_NUMBER_ALREADY_EXISTS") {
      setSubmitError("Table number already exists. Please choose a different number.");
    } else if (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  }, [error]);

  useEffect(() => {
    if (!open) {
      reset({ number: undefined, name: "" });
      setSubmitError(null);
    }
  }, [open, reset]);

  function handleFormSubmit(data: AddTableFormValues) {
    setSubmitError(null);
    onSubmit(data);
  }

  return (
    <Modal
      open={open}
      title="Add Table"
      onClose={onClose}
      footer={
        <div className="table-form__actions">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit(handleFormSubmit)()}
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create Table"}
          </Button>
        </div>
      }
    >
      <form
        className="table-form"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(handleFormSubmit)(e);
        }}
      >
        <Input
          label="Table Number"
          type="number"
          placeholder="e.g. 5"
          {...register("number", { valueAsNumber: true })}
          error={errors.number?.message}
        />
        <Input
          label="Table Name"
          placeholder="e.g. Main Hall"
          {...register("name")}
          error={errors.name?.message}
        />
        {submitError && (
          <p className="table-form__error" role="alert">
            {submitError}
          </p>
        )}
      </form>
    </Modal>
  );
}
