import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal } from "@/components/ui";
import type { Category } from "../categories.types";

const editCategorySchema = z.object({
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

type EditCategoryFormValues = z.infer<typeof editCategorySchema>;

export interface EditCategoryModalProps {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSubmit: (categoryId: string, data: EditCategoryFormValues) => void;
  isPending: boolean;
}

export function EditCategoryModal({
  open,
  category,
  onClose,
  onSubmit,
  isPending,
}: EditCategoryModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditCategoryFormValues>({
    resolver: zodResolver(editCategorySchema),
  });

  useEffect(() => {
    if (category) {
      reset({ name: category.name, description: category.description ?? "" });
    }
  }, [category, reset]);

  function handleFormSubmit(data: EditCategoryFormValues) {
    if (category) {
      onSubmit(category.id, data);
    }
  }

  return (
    <Modal
      open={open}
      title="Edit Category"
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
            {isPending ? "Saving..." : "Save Changes"}
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
          {...register("name")}
          error={errors.name?.message}
        />
        <Input
          label="Description"
          {...register("description")}
          error={errors.description?.message}
        />
      </form>
    </Modal>
  );
}
