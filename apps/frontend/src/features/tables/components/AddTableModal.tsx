import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal } from "@/components/ui";

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
}

export function AddTableModal({
  open,
  onClose,
  onSubmit,
  isPending,
}: AddTableModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddTableFormValues>({
    resolver: zodResolver(addTableSchema),
  });

  useEffect(() => {
    if (!open) {
      reset({ number: undefined, name: "" });
    }
  }, [open, reset]);

  function handleFormSubmit(data: AddTableFormValues) {
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
      </form>
    </Modal>
  );
}
