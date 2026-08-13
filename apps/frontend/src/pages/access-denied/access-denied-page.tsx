import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { getDefaultRoute } from "@/features/auth/permissions";

export function AccessDeniedPage() {
  const { user } = useAuth();
  const home = user ? getDefaultRoute(user) : "/login";

  return (
    <main className="status-page">
      <h1 className="status-page__code">403</h1>
      <p className="status-page__title">Access Denied</p>
      <p className="status-page__message">
        You don&apos;t have permission to access this page.
      </p>
      <Link className="status-page__link" to={home}>
        Back to Home
      </Link>
    </main>
  );
}
