import { useEffect } from "react";

export interface ToastProps {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    if (type !== "success") {
      return;
    }
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [type, onDismiss]);

  return (
    <div className={`toast toast--${type}`} role="status" aria-live="polite">
      <span className="toast__message">{message}</span>
      <button
        type="button"
        className="toast__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
