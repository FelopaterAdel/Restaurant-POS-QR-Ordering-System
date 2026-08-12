import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getHealth } from "@/services/health";

type ServerStatusState =
  | { status: "loading" }
  | { status: "online"; message: string }
  | { status: "offline"; error: string };

export function ServerStatus() {
  const [state, setState] = useState<ServerStatusState>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then((result) => {
        if (!cancelled) {
          setState({ status: "online", message: result.message });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ status: "offline", error: getApiErrorMessage(error) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="server-status" aria-live="polite">
      {state.status === "loading" && <span>Checking server…</span>}
      {state.status === "online" && (
        <span className="server-status__online">{state.message}</span>
      )}
      {state.status === "offline" && (
        <span className="server-status__offline">{state.error}</span>
      )}
    </div>
  );
}
