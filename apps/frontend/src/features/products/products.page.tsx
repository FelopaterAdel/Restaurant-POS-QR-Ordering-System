import { useCallback, useState } from "react";
import { EmptyState, ErrorState, Button } from "@/components/ui";
import { useAuth } from "@/features/auth/use-auth";
import { useCategoriesQuery } from "@/features/categories/categories.queries";
import { useProductsQuery } from "./products.queries";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useDisableProductMutation,
} from "./products.mutations";
import type { Product } from "./products.types";
import { ProductTable, ProductTableSkeleton } from "./components/ProductTable";
import { AddProductModal } from "./components/AddProductModal";
import { EditProductModal } from "./components/EditProductModal";
import { ToggleProductDialog } from "./components/ToggleProductDialog";
import "./products.css";

export default function ProductsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER" || user?.role === "MANAGER";

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);

  const { data: categories } = useCategoriesQuery();
  const { data, isLoading, error, refetch } = useProductsQuery();
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const disableMutation = useDisableProductMutation();

  const openEditModal = useCallback((product: Product) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  }, []);

  const openToggleDialog = useCallback((product: Product) => {
    setSelectedProduct(product);
    setToggleDialogOpen(true);
  }, []);

  const closeAllModals = useCallback(() => {
    setAddModalOpen(false);
    setEditModalOpen(false);
    setToggleDialogOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleAddSubmit = useCallback(
    (data: {
      name: string;
      categoryId: string;
      description?: string | null;
      price: number;
      imageUrl?: string | null;
    }) => {
      createMutation.mutate(data, { onSuccess: closeAllModals });
    },
    [createMutation, closeAllModals],
  );

  const handleEditSubmit = useCallback(
    (
      productId: string,
      data: {
        name: string;
        categoryId: string;
        description?: string | null;
        price: number;
        imageUrl?: string | null;
      },
    ) => {
      updateMutation.mutate(
        { id: productId, data },
        { onSuccess: closeAllModals },
      );
    },
    [updateMutation, closeAllModals],
  );

  const handleToggleConfirm = useCallback(
    (productId: string) => {
      const product = data?.find((p) => p.id === productId);
      if (!product) return;
      updateMutation.mutate(
        { id: productId, data: { isAvailable: !product.isAvailable } },
        { onSuccess: closeAllModals },
      );
    },
    [data, updateMutation, closeAllModals],
  );

  if (isLoading) {
    return (
      <div>
        <h1>Products</h1>
        <ProductTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Products</h1>
        <ErrorState
          title="Failed to load products"
          description={error.message}
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="products-header">
        <h1 className="products-header__title">Products</h1>
        {canManage && (
          <Button onClick={() => setAddModalOpen(true)}>+ Add</Button>
        )}
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Create your first product to start your menu."
          action={
            canManage ? (
              <Button onClick={() => setAddModalOpen(true)}>
                Add Product
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ProductTable
          products={data}
          canManage={canManage}
          onEdit={openEditModal}
          onToggle={openToggleDialog}
        />
      )}

      <AddProductModal
        open={addModalOpen}
        categories={categories ?? []}
        onClose={closeAllModals}
        onSubmit={handleAddSubmit}
        isPending={createMutation.isPending}
      />

      <EditProductModal
        open={editModalOpen}
        product={selectedProduct}
        categories={categories ?? []}
        onClose={closeAllModals}
        onSubmit={handleEditSubmit}
        isPending={updateMutation.isPending}
      />

      <ToggleProductDialog
        open={toggleDialogOpen}
        product={selectedProduct}
        onClose={closeAllModals}
        onConfirm={handleToggleConfirm}
        isPending={disableMutation.isPending}
      />
    </div>
  );
}
