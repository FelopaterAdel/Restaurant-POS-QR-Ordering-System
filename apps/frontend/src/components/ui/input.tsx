import { useId } from "react";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  const id = useId();

  return (
    <div className="input">
      {label && (
        <label htmlFor={id} className="input__label">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`input__control${error ? " input__control--invalid" : ""}${className ? ` ${className}` : ""}`}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && (
        <span className="input__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
