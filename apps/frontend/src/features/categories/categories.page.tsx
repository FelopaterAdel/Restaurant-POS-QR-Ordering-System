import { useCallback, useState } from "react";
import { EmptyState, ErrorState, Button } from "@/components/ui";
import { useAuth } from "@/features/auth/use-auth";
import { useCategoriesQuery } from "./categories.queries";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDisableCategoryMutation,
} from "./categories.mutations";
import type { Category } from "./categories.types";
import { CategoryTable, CategoryTableSkeleton } from "./components/CategoryTable";
import { AddCategoryModal } from "./components/AddCategoryModal";
import { EditCategoryModal } from "./components/EditCategoryModal";
import { ToggleCategoryDialog } from "./components/ToggleCategoryDialog";
import "./categories.css";

export default function CategoriesPage() {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER" || user?.role === "MANAGER";

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useCategoriesQuery();
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const disableMutation = useDisableCategoryMutation();

  const openEditModal = useCallback((category: Category) => {
    setSelectedCategory(category);
    setEditModalOpen(true);
  }, []);

  const openToggleDialog = useCallback((category: Category) => {
    setSelectedCategory(category);
    setToggleDialogOpen(true);
  }, []);

  const closeAllModals = useCallback(() => {
    setAddModalOpen(false);
    setEditModalOpen(false);
    setToggleDialogOpen(false);
    setSelectedCategory(null);
  }, []);

  const handleAddSubmit = useCallback(
    (data: { name: string; description?: string | null }) => {
      createMutation.mutate(data, { onSuccess: closeAllModals });
    },
    [createMutation, closeAllModals],
  );

  const handleEditSubmit = useCallback(
    (
      categoryId: string,
      data: { name: string; description?: string | null },
    ) => {
      updateMutation.mutate(
        { id: categoryId, data },
        { onSuccess: closeAllModals },
      );
    },
    [updateMutation, closeAllModals],
  );

  const handleToggleConfirm = useCallback(
    (categoryId: string) => {
      const category = data?.find((c) => c.id === categoryId);
      if (!category) return;
      updateMutation.mutate(
        { id: categoryId, data: { isActive: !category.isActive } },
        { onSuccess: closeAllModals },
      );
    },
    [data, updateMutation, closeAllModals],
  );

  if (isLoading) {
    return (
      <div>
        <h1>Categories</h1>
        <CategoryTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Categories</h1>
        <ErrorState
          title="Failed to load categories"
          description={error.message}
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="categories-header">
        <h1 className="categories-header__title">Categories</h1>
        {canManage && (
          <Button onClick={() => setAddModalOpen(true)}>+ Add</Button>
        )}
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create your first category to organize your menu."
          action={
            canManage ? (
              <Button onClick={() => setAddModalOpen(true)}>
                Add Category
              </Button>
            ) : undefined
          }
        />
      ) : (
        <CategoryTable
          categories={data}
          canManage={canManage}
          onEdit={openEditModal}
          onToggle={openToggleDialog}
        />
      )}

      <AddCategoryModal
        open={addModalOpen}
        onClose={closeAllModals}
        onSubmit={handleAddSubmit}
        isPending={createMutation.isPending}
      />

      <EditCategoryModal
        open={editModalOpen}
        category={selectedCategory}
        onClose={closeAllModals}
        onSubmit={handleEditSubmit}
        isPending={updateMutation.isPending}
      />

      <ToggleCategoryDialog
        open={toggleDialogOpen}
        category={selectedCategory}
        onClose={closeAllModals}
        onConfirm={handleToggleConfirm}
        isPending={disableMutation.isPending}
      />
    </div>
  );
}
