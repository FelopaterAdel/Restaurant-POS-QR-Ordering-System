import { Button, Modal } from "@/components/ui";
import type { Category } from "../categories.types";

export interface ToggleCategoryDialogProps {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onConfirm: (categoryId: string) => void;
  isPending: boolean;
}

export function ToggleCategoryDialog({
  open,
  category,
  onClose,
  onConfirm,
  isPending,
}: ToggleCategoryDialogProps) {
  if (!category) return null;

  const action = category.isActive ? "Disable" : "Enable";

  return (
    <Modal
      open={open}
      title={`${action} Category`}
      onClose={onClose}
      footer={
        <div className="category-toggle-dialog__actions">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={category.isActive ? "danger" : "primary"}
            onClick={() => onConfirm(category.id)}
            disabled={isPending}
          >
            {isPending ? `${action}ing...` : action}
          </Button>
        </div>
      }
    >
      <div className="category-toggle-dialog">
        <p className="category-toggle-dialog__message">
          Are you sure you want to {action.toLowerCase()} the category{" "}
          <strong>{category.name}</strong>?
        </p>
        <div className="category-toggle-dialog__category-info">
          {category.isActive
            ? "Products in this category will no longer appear in the public menu."
            : "Products in this category will appear in the public menu again."}
        </div>
      </div>
    </Modal>
  );
}
