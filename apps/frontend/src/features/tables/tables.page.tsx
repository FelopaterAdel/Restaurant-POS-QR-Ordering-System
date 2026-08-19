import { useCallback, useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  Button,
} from "@/components/ui";
import { useAuth } from "@/features/auth/use-auth";
import { useTablesQuery } from "./tables.queries";
import {
  useCreateTableMutation,
  useUpdateTableMutation,
  useDisableTableMutation,
} from "./tables.mutations";
import type { Table } from "./tables.types";
import { TableGrid, TableGridSkeleton } from "./components/TableGrid";
import { AddTableModal } from "./components/AddTableModal";
import { EditTableModal } from "./components/EditTableModal";
import { DisableTableDialog } from "./components/DisableTableDialog";
import { TableQrModal } from "./components/TableQrModal";

export default function TablesPage() {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER" || user?.role === "MANAGER";

  const [filter, setFilter] = useState<string>("all");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useTablesQuery();
  const createMutation = useCreateTableMutation();
  const updateMutation = useUpdateTableMutation();
  const disableMutation = useDisableTableMutation();

  const filteredTables = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data;
    return data.filter((t) => t.status === filter);
  }, [data, filter]);

  const openEditModal = useCallback((table: Table) => {
    setSelectedTable(table);
    setEditModalOpen(true);
  }, []);

  const openDisableDialog = useCallback((table: Table) => {
    setSelectedTable(table);
    setDisableDialogOpen(true);
  }, []);

  const openQrModal = useCallback((table: Table) => {
    setSelectedTable(table);
    setQrModalOpen(true);
  }, []);

  const closeAllModals = useCallback(() => {
    setAddModalOpen(false);
    setEditModalOpen(false);
    setDisableDialogOpen(false);
    setQrModalOpen(false);
    setSelectedTable(null);
  }, []);

  const handleAddSubmit = useCallback(
    (data: { number: number; name: string }) => {
      createMutation.mutate(data, { onSuccess: closeAllModals });
    },
    [createMutation, closeAllModals]
  );

  const handleEditSubmit = useCallback(
    (tableId: string, data: { number: number; name: string }) => {
      updateMutation.mutate(
        { id: tableId, data },
        { onSuccess: closeAllModals }
      );
    },
    [updateMutation, closeAllModals]
  );

  const handleDisableConfirm = useCallback(
    (tableId: string) => {
      disableMutation.mutate(tableId, { onSuccess: closeAllModals });
    },
    [disableMutation, closeAllModals]
  );

  if (isLoading) {
    return (
      <div>
        <h1>Tables</h1>
        <TableGridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Tables</h1>
        <ErrorState
          title="Failed to load tables"
          description={error.message}
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="tables-header">
        <h1 className="tables-header__title">Tables</h1>
        {canManage && (
          <Button onClick={() => setAddModalOpen(true)}>Add Table</Button>
        )}
      </div>

      <div className="tables-filters" role="group" aria-label="Filter tables by status">
        {["all", "AVAILABLE", "OCCUPIED", "DISABLED"].map((key) => (
          <button
            key={key}
            type="button"
            className={`tables-filter${filter === key ? " tables-filter--active" : ""}`}
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
          >
            {key === "all" ? "All" : key.charAt(0) + key.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {filteredTables.length === 0 ? (
        <EmptyState
          title="No tables found"
          description={
            filter === "all"
              ? "Get started by adding your first table."
              : `No ${filter.toLowerCase()} tables.`
          }
        />
      ) : (
        <TableGrid
          tables={filteredTables}
          canManage={canManage}
          onEdit={openEditModal}
          onDisable={openDisableDialog}
          onShowQr={openQrModal}
        />
      )}

      <AddTableModal
        open={addModalOpen}
        onClose={closeAllModals}
        onSubmit={handleAddSubmit}
        isPending={createMutation.isPending}
      />

      <EditTableModal
        open={editModalOpen}
        table={selectedTable}
        onClose={closeAllModals}
        onSubmit={handleEditSubmit}
        isPending={updateMutation.isPending}
      />

      <DisableTableDialog
        open={disableDialogOpen}
        table={selectedTable}
        onClose={closeAllModals}
        onConfirm={handleDisableConfirm}
        isPending={disableMutation.isPending}
      />

      <TableQrModal
        open={qrModalOpen}
        table={selectedTable}
        onClose={closeAllModals}
      />
    </div>
  );
}
