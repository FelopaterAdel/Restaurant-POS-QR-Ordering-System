export function PagePlaceholder({ title }: { title: string }) {
  return (
    <main className="placeholder">
      <h1 className="placeholder__title">{title}</h1>
      <p className="placeholder__note">Coming in a later sprint.</p>
    </main>
  );
}
