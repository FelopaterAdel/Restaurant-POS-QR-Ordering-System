import { Spinner } from "@/components/ui";

export function AuthLoading() {
  return (
    <main className="auth-loading" aria-live="polite">
      <Spinner label="Checking session…" />
    </main>
  );
}
