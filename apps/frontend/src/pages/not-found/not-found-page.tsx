import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="status-page">
      <h1 className="status-page__code">404</h1>
      <p className="status-page__title">Page Not Found</p>
      <Link className="status-page__link" to="/">
        Go Home
      </Link>
    </main>
  );
}
