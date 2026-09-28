import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
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
  Badge,
} from "@/components/ui";
import { useAuth } from "@/features/auth/use-auth";
import { useProductsQuery } from "@/features/products/products.queries";
import { useIngredientsQuery, useProductRecipeQuery } from "./inventory.queries";
import {
  useCreateIngredientMutation,
  useDisableIngredientMutation,
  useSetProductRecipeMutation,
  useUpdateIngredientMutation,
} from "./inventory.mutations";
import type { Ingredient } from "./inventory.types";
import "./inventory.css";

const ingredientFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  unit: z.string().trim().min(1, "Unit is required").max(20),
  quantityInStock: z.number().min(0),
  lowStockThreshold: z.number().min(0),
});

type IngredientFormValues = z.infer<typeof ingredientFormSchema>;

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

export default function InventoryPage() {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER" || user?.role === "MANAGER";

  const {
    data: ingredients,
    isLoading,
    error,
    refetch,
  } = useIngredientsQuery();
  const { data: products } = useProductsQuery();

  const createMutation = useCreateIngredientMutation();
  const updateMutation = useUpdateIngredientMutation();
  const disableMutation = useDisableIngredientMutation();
  const setRecipeMutation = useSetProductRecipeMutation();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [draftRows, setDraftRows] = useState<
    Array<{ ingredientId: string; quantityUsed: number }>
  >([]);

  const { data: recipe, isLoading: recipeLoading } =
    useProductRecipeQuery(selectedProductId);

  useEffect(() => {
    if (recipe) {
      setDraftRows(
        recipe.map((row) => ({
          ingredientId: row.ingredientId,
          quantityUsed: toNumber(row.quantityUsed),
        })),
      );
    } else {
      setDraftRows([]);
    }
  }, [recipe, selectedProductId]);

  const activeIngredients = useMemo(
    () => (ingredients ?? []).filter((i) => i.isActive),
    [ingredients],
  );

  const lowStock = useMemo(
    () =>
      (ingredients ?? []).filter(
        (i) => toNumber(i.quantityInStock) <= toNumber(i.lowStockThreshold),
      ),
    [ingredients],
  );

  function closeModals() {
    setAddOpen(false);
    setEditing(null);
  }

  function handleSaveRecipe() {
    if (!selectedProductId) return;
    setRecipeMutation.mutate({
      productId: selectedProductId,
      data: { items: draftRows },
    });
  }

  if (isLoading) {
    return (
      <div>
        <h1>Inventory</h1>
        <p>Loading ingredients…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Inventory</h1>
        <ErrorState
          title="Failed to load ingredients"
          description={error.message}
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      </div>
    );
  }

  return (
    <div className="inventory">
      <div className="inventory__header">
        <h1 className="inventory__title">Inventory</h1>
        {canManage && (
          <Button onClick={() => setAddOpen(true)}>+ Add ingredient</Button>
        )}
      </div>

      {lowStock.length > 0 && (
        <div className="inventory__alert" role="alert">
          Low stock:{" "}
          {lowStock
            .map((i) => `${i.name} (${String(i.quantityInStock)} ${i.unit})`)
            .join(", ")}
        </div>
      )}

      {!ingredients || ingredients.length === 0 ? (
        <EmptyState
          title="No ingredients yet"
          description="Create your first ingredient, then attach recipes to products."
          action={
            canManage ? (
              <Button onClick={() => setAddOpen(true)}>
                Add ingredient
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Unit</TableHeaderCell>
              <TableHeaderCell>In stock</TableHeaderCell>
              <TableHeaderCell>Low-stock at</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              {canManage && <TableHeaderCell>Actions</TableHeaderCell>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.map((ingredient) => {
              const isLow =
                toNumber(ingredient.quantityInStock) <=
                toNumber(ingredient.lowStockThreshold);
              return (
                <TableRow key={ingredient.id}>
                  <TableCell>{ingredient.name}</TableCell>
                  <TableCell>{ingredient.unit}</TableCell>
                  <TableCell>{String(ingredient.quantityInStock)}</TableCell>
                  <TableCell>{String(ingredient.lowStockThreshold)}</TableCell>
                  <TableCell>
                    <Badge variant={ingredient.isActive ? "success" : "neutral"}>
                      {isLow ? "Low stock" : ingredient.isActive ? "OK" : "Disabled"}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="inventory__row-actions">
                        <Button
                          variant="outline"
                          onClick={() => setEditing(ingredient)}
                        >
                          Edit
                        </Button>
                        {ingredient.isActive && (
                          <Button
                            variant="outline"
                            disabled={disableMutation.isPending}
                            onClick={() =>
                              disableMutation.mutate(ingredient.id)
                            }
                          >
                            Disable
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <section className="inventory__recipes">
        <h2>Product recipes</h2>
        <p className="inventory__hint">
          Select a product, attach the ingredients and quantities it consumes
          (e.g. one burger = 1 bun + 150g beef).
        </p>
        <div className="inventory__recipe-controls">
          <select
            aria-label="Product"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">Select a product…</option>
            {(products ?? []).map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          {canManage && selectedProductId && (
            <Button
              disabled={
                setRecipeMutation.isPending ||
                draftRows.some((r) => !r.ingredientId || r.quantityUsed <= 0)
              }
              onClick={handleSaveRecipe}
            >
              {setRecipeMutation.isPending ? "Saving…" : "Save recipe"}
            </Button>
          )}
        </div>

        {selectedProductId && recipeLoading && <p>Loading recipe…</p>}

        {selectedProductId && !recipeLoading && (
          <div className="inventory__draft">
            {draftRows.map((row, index) => (
              <div key={index} className="inventory__draft-row">
                <select
                  aria-label={`Ingredient ${index + 1}`}
                  value={row.ingredientId}
                  onChange={(e) =>
                    setDraftRows((prev) =>
                      prev.map((r, i) =>
                        i === index
                          ? { ...r, ingredientId: e.target.value }
                          : r,
                      ),
                    )
                  }
                >
                  <option value="">Select ingredient…</option>
                  {activeIngredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name} ({ingredient.unit})
                    </option>
                  ))}
                </select>
                <Input
                  aria-label={`Quantity ${index + 1}`}
                  type="number"
                  min={0}
                  step="any"
                  value={String(row.quantityUsed)}
                  onChange={(e) =>
                    setDraftRows((prev) =>
                      prev.map((r, i) =>
                        i === index
                          ? { ...r, quantityUsed: Number(e.target.value) }
                          : r,
                      ),
                    )
                  }
                />
                {canManage && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setDraftRows((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {canManage && (
              <Button
                variant="outline"
                onClick={() =>
                  setDraftRows((prev) => [
                    ...prev,
                    { ingredientId: "", quantityUsed: 1 },
                  ])
                }
              >
                + Add row
              </Button>
            )}
          </div>
        )}
      </section>

      <IngredientModal
        open={addOpen}
        title="Add ingredient"
        submitLabel={createMutation.isPending ? "Creating…" : "Create"}
        isPending={createMutation.isPending}
        onClose={closeModals}
        onSubmit={(values) =>
          createMutation.mutate(values, { onSuccess: closeModals })
        }
      />
      <IngredientModal
        open={editing !== null}
        title="Edit ingredient"
        submitLabel={updateMutation.isPending ? "Saving…" : "Save"}
        isPending={updateMutation.isPending}
        initial={editing}
        onClose={closeModals}
        onSubmit={(values) => {
          if (!editing) return;
          updateMutation.mutate(
            { id: editing.id, data: values },
            { onSuccess: closeModals },
          );
        }}
      />
    </div>
  );
}

function IngredientModal({
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
  initial?: Ingredient | null;
  onClose: () => void;
  onSubmit: (values: IngredientFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: { name: "", unit: "", quantityInStock: 0, lowStockThreshold: 0 },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? "",
        unit: initial?.unit ?? "",
        quantityInStock: initial ? toNumber(initial.quantityInStock) : 0,
        lowStockThreshold: initial
          ? toNumber(initial.lowStockThreshold)
          : 0,
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
          label="Name"
          placeholder="e.g. Flour"
          {...register("name")}
          error={errors.name?.message}
        />
        <Input
          label="Unit"
          placeholder="e.g. kg, g, pcs, liter"
          {...register("unit")}
          error={errors.unit?.message}
        />
        <Input
          label="Quantity in stock"
          type="number"
          min={0}
          step="any"
          {...register("quantityInStock", { valueAsNumber: true })}
          error={errors.quantityInStock?.message}
        />
        <Input
          label="Low-stock threshold"
          type="number"
          min={0}
          step="any"
          {...register("lowStockThreshold", { valueAsNumber: true })}
          error={errors.lowStockThreshold?.message}
        />
      </form>
    </Modal>
  );
}
