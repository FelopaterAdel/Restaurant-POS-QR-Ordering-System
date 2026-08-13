import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="input">
      {label && <span className="input__label">{label}</span>}
      <input
        className={`input__control${error ? " input__control--invalid" : ""}${className ? ` ${className}` : ""}`}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && (
        <span className="input__error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
