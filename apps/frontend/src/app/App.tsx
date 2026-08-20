import { useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "@/components/ui";
import { createAppRouter } from "@/routes";

export function App() {
  const router = useMemo(() => createAppRouter(), []);
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
