import { useCallback, useState } from "react";
import { Button, EmptyState, ErrorState } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useStaffQuery } from "./users.queries";
import {
  useCreateStaffMutation,
  useUpdateStaffStatusMutation,
} from "./users.mutations";
import type { Staff, StaffStatus } from "./users.types";
import { StaffTable, StaffTableSkeleton } from "./components/StaffTable";
import { StaffForm } from "./components/StaffForm";
import { StaffDetailsModal } from "./components/StaffDetailsModal";
import { ToggleStaffStatusDialog } from "./components/ToggleStaffStatusDialog";
import "./users.css";

export default function UsersPage() {
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useStaffQuery();
  const createMutation = useCreateStaffMutation();
  const updateStatusMutation = useUpdateStaffStatusMutation();

  const handleSelectStaff = useCallback((staff: Staff) => {
    setSelectedStaff(staff);
    setDetailsOpen(true);
  }, []);

  const handleToggleStatus = useCallback((staff: Staff) => {
    setSelectedStaff(staff);
    setToggleDialogOpen(true);
  }, []);

  const closeAllModals = useCallback(() => {
    setAddFormOpen(false);
    setDetailsOpen(false);
    setToggleDialogOpen(false);
    setSelectedStaff(null);
  }, []);

  const handleAddSubmit = useCallback(
    (data: { name: string; email: string; password: string; role: "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN" }) => {
      createMutation.mutate(data, { onSuccess: closeAllModals });
    },
    [createMutation, closeAllModals],
  );

  const handleToggleConfirm = useCallback(
    (staffId: string, status: StaffStatus) => {
      updateStatusMutation.mutate(
        { staffId, status },
        { onSuccess: closeAllModals },
      );
    },
    [updateStatusMutation, closeAllModals],
  );

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
        <Button onClick={() => setAddFormOpen(true)}>+ Add Staff</Button>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          title="No staff members yet."
          action={
            <Button onClick={() => setAddFormOpen(true)}>Add Staff</Button>
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
      />

      <StaffDetailsModal
        open={detailsOpen}
        staff={selectedStaff}
        onClose={closeAllModals}
        onToggleStatus={handleToggleStatus}
      />

      <ToggleStaffStatusDialog
        open={toggleDialogOpen}
        staff={selectedStaff}
        onClose={closeAllModals}
        onConfirm={handleToggleConfirm}
        isPending={updateStatusMutation.isPending}
      />
    </div>
  );
}
