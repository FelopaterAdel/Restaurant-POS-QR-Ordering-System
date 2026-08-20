import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { getDefaultRoute } from "@/features/auth/permissions";

export function NotFoundPage() {
  const { user } = useAuth();
  const home = user ? getDefaultRoute(user) : "/";

  return (
    <main className="status-page">
      <h1 className="status-page__code">404</h1>
      <p className="status-page__title">Page Not Found</p>
      <p className="status-page__message">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link className="status-page__link" to={home}>
        Back to Dashboard
      </Link>
    </main>
  );
}
