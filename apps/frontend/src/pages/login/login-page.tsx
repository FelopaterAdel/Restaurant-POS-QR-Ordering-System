import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { resolvePostLoginRedirect } from "@/features/auth/permissions";
import { getApiErrorMessage } from "@/lib/api";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const user = await login({ email, password });
      const redirect = searchParams.get("redirect");
      navigate(resolvePostLoginRedirect(user, redirect), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <div className="login__brand">
          <span className="login__mark" aria-hidden="true">
            R
          </span>
          <span>
            <span className="login__brand-name">Restaurant POS</span>
            <br />
            <span className="login__brand-sub">Service console</span>
          </span>
        </div>
        <h1 className="login__title h2">Welcome back</h1>
        <p className="login__subtitle">Sign in to start your shift.</p>
        <Input
          label="Email"
          type="email"
          placeholder="you@restaurant.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" loading={submitting} className="button--block">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
