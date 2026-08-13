import { ServerStatus } from "@/components/ui/server-status";
import { useAuth } from "@/features/auth";

export function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const authLabel = isLoading
    ? "Checking session…"
    : isAuthenticated
      ? `Signed in as ${user?.name} (${user?.role})`
      : "Not signed in";

  return (
    <main className="home">
      <section className="home__card">
        <h1 className="home__title">{import.meta.env.VITE_APP_NAME}</h1>
        <p className="home__subtitle">Frontend foundation is ready.   FelopaterA</p>
        <ServerStatus />
        <p className="home__auth">{authLabel}</p>
      </section>
    </main>
  );
}
