import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Modal } from "@/components/ui";
import { apiClient } from "@/lib/api";
import type { Table } from "../tables.types";

export interface TableQrModalProps {
  open: boolean;
  table: Table | null;
  onClose: () => void;
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export function TableQrModal({ open, table, onClose }: TableQrModalProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !table) {
      setQrUrl(null);
      setError(null);
      setCopied(false);
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

  async function handleCopyUrl() {
    if (!table) return;
    const copiedOk = await copyToClipboard(table.menuUrl);
    if (copiedOk) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <>
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
              <Button variant="outline" onClick={() => void handleCopyUrl()}>
                {copied ? "Copied!" : "Copy URL"}
              </Button>
            )}
            {qrUrl && (
              <Button onClick={handlePrint}>Print</Button>
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
                  width={220}
                  height={220}
                />
              </div>
              <p className="table-qr-modal__label">
                Table #{table?.number}
                {table?.name ? ` — ${table.name}` : ""}
              </p>
              {table?.menuUrl && (
                <p className="table-qr-modal__url">{table.menuUrl}</p>
              )}
              <p className="table-qr-modal__hint">
                Guests scan this QR to open the menu and order for this table.
              </p>
            </>
          )}
        </div>
      </Modal>

      {open &&
        qrUrl &&
        table &&
        createPortal(
          <div className="qr-print-sheet" aria-hidden="true">
            <h1 className="qr-print-sheet__title">Table #{table.number}</h1>
            {table.name && (
              <p className="qr-print-sheet__name">{table.name}</p>
            )}
            <img
              src={qrUrl}
              alt=""
              className="qr-print-sheet__image"
              width={512}
              height={512}
            />
            <p className="qr-print-sheet__url">{table.menuUrl}</p>
            <p className="qr-print-sheet__hint">
              Scan to view the menu and order
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
