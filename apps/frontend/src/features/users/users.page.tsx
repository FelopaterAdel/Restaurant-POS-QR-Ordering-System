import { useCallback, useState } from "react";
import { Button, EmptyState, ErrorState, Toast } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useStaffQuery } from "./users.queries";
import {
  useCreateStaffMutation,
  useUpdateStaffProfileMutation,
  useUpdateStaffStatusMutation,
} from "./users.mutations";
import type { Staff, StaffStatus } from "./users.types";
import { StaffTable, StaffTableSkeleton } from "./components/StaffTable";
import { StaffForm } from "./components/StaffForm";
import { StaffDetailsModal } from "./components/StaffDetailsModal";
import { ToggleStaffStatusDialog } from "./components/ToggleStaffStatusDialog";
import { EditStaffForm } from "./components/EditStaffForm";
import { ApiError } from "@/lib/api/errors";
import "./users.css";

interface StaffToast {
  type: "success" | "error";
  message: string;
}

export default function UsersPage() {
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [toast, setToast] = useState<StaffToast | null>(null);

  const { data, isLoading, error, refetch } = useStaffQuery();
  const createMutation = useCreateStaffMutation();
  const updateProfileMutation = useUpdateStaffProfileMutation();
  const updateStatusMutation = useUpdateStaffStatusMutation();

  const dismissToast = useCallback(() => setToast(null), []);

  const handleSelectStaff = useCallback((staff: Staff) => {
    setSelectedStaff(staff);
    setDetailsOpen(true);
  }, []);

  const handleOpenAddForm = useCallback(() => {
    createMutation.reset();
    setAddFormOpen(true);
  }, [createMutation]);

  const handleEditStaff = useCallback(
    (staff: Staff) => {
      updateProfileMutation.reset();
      setDetailsOpen(false);
      setSelectedStaff(staff);
      setEditFormOpen(true);
    },
    [updateProfileMutation],
  );

  const handleToggleStatus = useCallback(
    (staff: Staff) => {
      updateStatusMutation.reset();
      setSelectedStaff(staff);
      setToggleDialogOpen(true);
    },
    [updateStatusMutation],
  );

  const closeAllModals = useCallback(() => {
    setAddFormOpen(false);
    setEditFormOpen(false);
    setDetailsOpen(false);
    setToggleDialogOpen(false);
    setSelectedStaff(null);
  }, []);

  const handleAddSubmit = useCallback(
    (data: { name: string; email: string; password: string; role: "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN" }) => {
      createMutation.mutate(data, {
        onSuccess: (created) => {
          closeAllModals();
          setToast({
            type: "success",
            message: `${created.name} was added to the team.`,
          });
        },
      });
    },
    [createMutation, closeAllModals],
  );

  const handleEditSubmit = useCallback(
    (data: { name: string; email: string; role: "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN" }) => {
      if (!selectedStaff) return;
      updateProfileMutation.mutate(
        { staffId: selectedStaff.id, input: data },
        {
          onSuccess: (updated) => {
            closeAllModals();
            setToast({
              type: "success",
              message: `${updated.name}'s profile was updated.`,
            });
          },
        },
      );
    },
    [selectedStaff, updateProfileMutation, closeAllModals],
  );

  const handleToggleConfirm = useCallback(
    (staffId: string, status: StaffStatus) => {
      updateStatusMutation.mutate(
        { staffId, status },
        {
          onSuccess: (updated) => {
            closeAllModals();
            setToast({
              type: "success",
              message:
                status === "ACTIVE"
                  ? `${updated.name} can access the system again.`
                  : `${updated.name} can no longer access the system.`,
            });
          },
          onError: (mutationError) => {
            setToggleDialogOpen(false);
            setToast({
              type: "error",
              message: getApiErrorMessage(mutationError),
            });
          },
        },
      );
    },
    [updateStatusMutation, closeAllModals],
  );

  function getEditErrorMessage(err: unknown): string {
    if (err instanceof ApiError && err.code === "EMAIL_ALREADY_EXISTS") {
      return "This email is already in use.";
    }
    return getApiErrorMessage(err);
  }

  if (isLoading) {
    return (
      <div>
        <h1>Staff</h1>
        <StaffTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Staff</h1>
        <ErrorState
          title="Unable to load staff members."
          description={getApiErrorMessage(error)}
          action={<Button onClick={() => void refetch()}>Try Again</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="users-header">
        <h1 className="users-header__title">Staff</h1>
        <Button onClick={handleOpenAddForm}>+ Add Staff</Button>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          title="No staff members yet."
          action={
            <Button onClick={handleOpenAddForm}>Add Staff</Button>
          }
        />
      ) : (
        <StaffTable
          staff={data}
          onSelect={handleSelectStaff}
          onToggleStatus={handleToggleStatus}
        />
      )}

      <StaffForm
        open={addFormOpen}
        onClose={closeAllModals}
        onSubmit={handleAddSubmit}
        isPending={createMutation.isPending}
        error={
          createMutation.error
            ? getEditErrorMessage(createMutation.error)
            : null
        }
      />

      <StaffDetailsModal
        open={detailsOpen}
        staff={selectedStaff}
        onClose={closeAllModals}
        onEdit={handleEditStaff}
        onToggleStatus={handleToggleStatus}
      />

      <EditStaffForm
        open={editFormOpen}
        staff={selectedStaff}
        onClose={closeAllModals}
        onSubmit={handleEditSubmit}
        isPending={updateProfileMutation.isPending}
        error={
          updateProfileMutation.error
            ? getEditErrorMessage(updateProfileMutation.error)
            : null
        }
      />

      <ToggleStaffStatusDialog
        open={toggleDialogOpen}
        staff={selectedStaff}
        onClose={closeAllModals}
        onConfirm={handleToggleConfirm}
        isPending={updateStatusMutation.isPending}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}
