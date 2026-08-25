import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { useTablesQuery } from "@/features/tables/tables.queries";
import { PublicMenuView } from "@/features/menu/components/PublicMenuView";

export default function MenuPreviewPage() {
  const navigate = useNavigate();
  const { data: tables, isLoading, error } = useTablesQuery();

  const activeTable = tables?.find((t) => t.status === "AVAILABLE");

  useEffect(() => {
    if (!isLoading && !error && (!tables || tables.length === 0)) {
      // allow empty state to show
    }
  }, [tables, isLoading, error]);

  if (isLoading) {
    return (
      <div className="menu-preview-page">
        <div className="menu-preview__loading">
          <span>Loading preview…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="menu-preview-page">
        <div className="menu-preview__error">
          <h2>Failed to load tables</h2>
          <p>{error.message}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!activeTable) {
    return (
      <div className="menu-preview-page">
        <div className="menu-page__empty">
          <p className="menu-page__empty-title">No active table available for preview.</p>
          <p className="menu-page__empty-message">
            Create a table to preview the customer menu.
          </p>
          <Button variant="primary" onClick={() => navigate("/tables")}>
            Manage Tables
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-preview-page">
      <PublicMenuView
        qrCode={activeTable.qrCode}
        readOnly
        previewBanner
      />
    </div>
  );
}
