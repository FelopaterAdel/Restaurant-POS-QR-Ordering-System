import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal } from "@/components/ui";
import type { Table } from "../tables.types";

const editTableSchema = z.object({
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

type EditTableFormValues = z.infer<typeof editTableSchema>;

export interface EditTableModalProps {
  open: boolean;
  table: Table | null;
  onClose: () => void;
  onSubmit: (tableId: string, data: EditTableFormValues) => void;
  isPending: boolean;
}

export function EditTableModal({
  open,
  table,
  onClose,
  onSubmit,
  isPending,
}: EditTableModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditTableFormValues>({
    resolver: zodResolver(editTableSchema),
  });

  useEffect(() => {
    if (table) {
      reset({ number: table.number, name: table.name });
    }
  }, [table, reset]);

  function handleFormSubmit(data: EditTableFormValues) {
    if (table) {
      onSubmit(table.id, data);
    }
  }

  return (
    <Modal
      open={open}
      title="Edit Table"
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
            {isPending ? "Saving..." : "Save Changes"}
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
          {...register("number", { valueAsNumber: true })}
          error={errors.number?.message}
        />
        <Input
          label="Table Name"
          {...register("name")}
          error={errors.name?.message}
        />
      </form>
    </Modal>
  );
}
