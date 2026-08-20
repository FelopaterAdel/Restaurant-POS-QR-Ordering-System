import { Button, Modal } from "@/components/ui";
import type { Product } from "../products.types";

export interface ToggleProductDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (productId: string) => void;
  isPending: boolean;
}

export function ToggleProductDialog({
  open,
  product,
  onClose,
  onConfirm,
  isPending,
}: ToggleProductDialogProps) {
  if (!product) return null;

  const action = product.isAvailable ? "Disable" : "Enable";

  return (
    <Modal
      open={open}
      title={`${action} Product`}
      onClose={onClose}
      footer={
        <div className="product-toggle-dialog__actions">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={product.isAvailable ? "danger" : "primary"}
            onClick={() => onConfirm(product.id)}
            disabled={isPending}
          >
            {isPending ? `${action}ing...` : action}
          </Button>
        </div>
      }
    >
      <div className="product-toggle-dialog">
        <p className="product-toggle-dialog__message">
          Are you sure you want to {action.toLowerCase()} the product{" "}
          <strong>{product.name}</strong>?
        </p>
        <div className="product-toggle-dialog__product-info">
          {product.isAvailable
            ? "This product will no longer appear in the public menu."
            : "This product will appear in the public menu again."}
        </div>
      </div>
    </Modal>
  );
}
