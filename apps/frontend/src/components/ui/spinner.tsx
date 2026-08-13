export interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label = "Loading…", className }: SpinnerProps) {
  return (
    <div className={`spinner${className ? ` ${className}` : ""}`} role="status">
      <span className="spinner__indicator" aria-hidden="true" />
      {label && <span className="spinner__label">{label}</span>}
    </div>
  );
}
