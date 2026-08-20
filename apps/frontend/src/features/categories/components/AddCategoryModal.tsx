import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal } from "@/components/ui";

const addCategorySchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
});

type AddCategoryFormValues = z.infer<typeof addCategorySchema>;

export interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddCategoryFormValues) => void;
  isPending: boolean;
}

export function AddCategoryModal({
  open,
  onClose,
  onSubmit,
  isPending,
}: AddCategoryModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddCategoryFormValues>({
    resolver: zodResolver(addCategorySchema),
  });

  useEffect(() => {
    if (!open) {
      reset({ name: "", description: "" });
    }
  }, [open, reset]);

  function handleFormSubmit(data: AddCategoryFormValues) {
    onSubmit(data);
  }

  return (
    <Modal
      open={open}
      title="Add Category"
      onClose={onClose}
      footer={
        <div className="category-form__actions">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit(handleFormSubmit)()}
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create Category"}
          </Button>
        </div>
      }
    >
      <form
        className="category-form"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(handleFormSubmit)(e);
        }}
      >
        <Input
          label="Name"
          placeholder="e.g. Burgers"
          {...register("name")}
          error={errors.name?.message}
        />
        <Input
          label="Description"
          placeholder="Optional description"
          {...register("description")}
          error={errors.description?.message}
        />
      </form>
    </Modal>
  );
}
