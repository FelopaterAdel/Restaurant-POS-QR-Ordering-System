import { useCallback, useEffect } from "react";

export interface StatusToastProps {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}

export function StatusToast({ message, type, onDismiss }: StatusToastProps) {
  useEffect(() => {
    if (type === "success") {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [type, onDismiss]);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  return (
    <div
      className={`status-toast status-toast--${type}`}
      role="status"
      aria-live="polite"
    >
      <span className="status-toast__message">{message}</span>
      <button
        type="button"
        className="status-toast__dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
