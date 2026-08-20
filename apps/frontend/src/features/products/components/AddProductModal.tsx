import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal } from "@/components/ui";
import type { Category } from "@/features/categories/categories.types";

const addProductSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  categoryId: z.string().min(1, "Category is required"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
  price: z
    .number({ message: "Price is required" })
    .positive("Price must be positive"),
  imageUrl: z
    .string()
    .trim()
    .max(2048, "Image URL must be at most 2048 characters")
    .optional()
    .nullable(),
});

type AddProductFormValues = z.infer<typeof addProductSchema>;

export interface AddProductModalProps {
  open: boolean;
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: AddProductFormValues) => void;
  isPending: boolean;
}

export function AddProductModal({
  open,
  categories,
  onClose,
  onSubmit,
  isPending,
}: AddProductModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
  });

  useEffect(() => {
    if (!open) {
      reset({ name: "", categoryId: "", description: "", price: undefined, imageUrl: "" });
    }
  }, [open, reset]);

  function handleFormSubmit(data: AddProductFormValues) {
    onSubmit(data);
  }

  const activeCategories = categories.filter((c) => c.isActive);

  return (
    <Modal
      open={open}
      title="Add Product"
      onClose={onClose}
      footer={
        <div className="product-form__actions">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit(handleFormSubmit)()}
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create Product"}
          </Button>
        </div>
      }
    >
      <form
        className="product-form"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(handleFormSubmit)(e);
        }}
      >
        <Input
          label="Name"
          placeholder="e.g. Classic Burger"
          {...register("name")}
          error={errors.name?.message}
        />
        {activeCategories.length === 0 ? (
          <p className="caption" style={{ color: "var(--color-warning)" }}>
            No active categories. Create a category first.
          </p>
        ) : (
          <div className="input">
            <label className="input__label" htmlFor="product-category">
              Category
            </label>
            <select
              id="product-category"
              className="input__control"
              {...register("categoryId")}
            >
              <option value="">Select a category</option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId?.message && (
              <p className="input__error">{errors.categoryId.message}</p>
            )}
          </div>
        )}
        <div className="product-form__row">
          <Input
            label="Price"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("price", { valueAsNumber: true })}
            error={errors.price?.message}
          />
          <Input
            label="Image URL"
            placeholder="https://..."
            {...register("imageUrl")}
            error={errors.imageUrl?.message}
          />
        </div>
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
