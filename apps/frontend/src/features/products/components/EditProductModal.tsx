import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal } from "@/components/ui";
import type { Category } from "@/features/categories/categories.types";
import type { Product } from "../products.types";

const editProductSchema = z.object({
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

type EditProductFormValues = z.infer<typeof editProductSchema>;

export interface EditProductModalProps {
  open: boolean;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (productId: string, data: EditProductFormValues) => void;
  isPending: boolean;
}

export function EditProductModal({
  open,
  product,
  categories,
  onClose,
  onSubmit,
  isPending,
}: EditProductModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProductFormValues>({
    resolver: zodResolver(editProductSchema),
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        categoryId: product.categoryId,
        description: product.description ?? "",
        price: product.price,
        imageUrl: product.imageUrl ?? "",
      });
    }
  }, [product, reset]);

  function handleFormSubmit(data: EditProductFormValues) {
    if (product) {
      onSubmit(product.id, data);
    }
  }

  return (
    <Modal
      open={open}
      title="Edit Product"
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
            {isPending ? "Saving..." : "Save Changes"}
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
          {...register("name")}
          error={errors.name?.message}
        />
        <div className="input">
          <label className="input__label" htmlFor="edit-product-category">
            Category
          </label>
          <select
            id="edit-product-category"
            className="input__control"
            {...register("categoryId")}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId?.message && (
            <p className="input__error">{errors.categoryId.message}</p>
          )}
        </div>
        <div className="product-form__row">
          <Input
            label="Price"
            type="number"
            step="0.01"
            {...register("price", { valueAsNumber: true })}
            error={errors.price?.message}
          />
          <Input
            label="Image URL"
            {...register("imageUrl")}
            error={errors.imageUrl?.message}
          />
        </div>
        <Input
          label="Description"
          {...register("description")}
          error={errors.description?.message}
        />
      </form>
    </Modal>
  );
}
