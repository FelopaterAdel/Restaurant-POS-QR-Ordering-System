import { ServerStatus } from "@/components/ui/server-status";

export function HomePage() {
  return (
    <main className="home">
      <section className="home__card">
        <h1 className="home__title">{import.meta.env.VITE_APP_NAME}</h1>
        <p className="home__subtitle">Frontend foundation is ready.   FelopaterA</p>
        <ServerStatus />
      </section>
    </main>
  );
}
