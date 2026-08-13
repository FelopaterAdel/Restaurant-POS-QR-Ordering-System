export function PagePlaceholder({ title }: { title: string }) {
  return (
    <section className="placeholder">
      <h1 className="placeholder__title h2">{title}</h1>
      <p className="placeholder__note">Coming in a later sprint.</p>
    </section>
  );
}
