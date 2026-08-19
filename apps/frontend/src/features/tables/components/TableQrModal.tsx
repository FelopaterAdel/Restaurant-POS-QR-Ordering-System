import { useEffect, useState } from "react";
import { Button, Modal } from "@/components/ui";
import { apiClient } from "@/lib/api";
import type { Table } from "../tables.types";

export interface TableQrModalProps {
  open: boolean;
  table: Table | null;
  onClose: () => void;
}

export function TableQrModal({ open, table, onClose }: TableQrModalProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !table) {
      setQrUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    let currentUrl: string | null = null;

    async function fetchQr() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/tables/${table!.id}/qr`, {
          responseType: "blob",
        });
        if (!cancelled) {
          const url = URL.createObjectURL(response.data as Blob);
          currentUrl = url;
          setQrUrl(url);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load QR code.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchQr();

    return () => {
      cancelled = true;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [open, table]);

  function handleDownload() {
    if (!qrUrl || !table) return;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `table-${table.number}-qr.png`;
    link.click();
  }

  return (
    <Modal
      open={open}
      title={table ? `QR Code — Table #${table.number}` : "QR Code"}
      onClose={onClose}
      footer={
        <div className="table-qr-modal__actions">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {qrUrl && (
            <Button onClick={handleDownload}>Download QR</Button>
          )}
        </div>
      }
    >
      <div className="table-qr-modal">
        {isLoading && (
          <p style={{ color: "var(--color-muted)", textAlign: "center" }}>
            Loading QR code...
          </p>
        )}
        {error && (
          <p style={{ color: "var(--color-danger)", textAlign: "center" }}>
            {error}
          </p>
        )}
        {qrUrl && (
          <>
            <div className="table-qr-modal__image">
              <img
                src={qrUrl}
                alt={`QR code for Table #${table?.number}`}
                width={200}
                height={200}
              />
            </div>
            <p style={{ textAlign: "center", color: "var(--color-muted)" }}>
              Scan this QR to open the menu for Table #{table?.number}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
