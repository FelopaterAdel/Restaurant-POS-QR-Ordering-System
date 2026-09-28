import { useState } from "react";
import { Button } from "@/components/ui";
import { ApiError, getApiErrorMessage } from "@/lib/api";
import { getPublicLoyaltyBalance, type LoyaltyBalance } from "./loyalty.api";
import "./loyalty.css";

export default function LoyaltyPage() {
  const [phone, setPhone] = useState("");
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) return;
    setIsLoading(true);
    setError(null);
    setBalance(null);
    try {
      const result = await getPublicLoyaltyBalance(trimmed);
      setBalance(result);
    } catch (err) {
      if (err instanceof ApiError && err.code === "LOYALTY_ACCOUNT_NOT_FOUND") {
        setError("No loyalty points found for this number yet.");
      } else {
        setError(getApiErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="loyalty-page">
      <h1 className="loyalty-page__title">Loyalty Points</h1>
      <p className="loyalty-page__subtitle">
        Enter your phone number to check your points balance.
      </p>

      <form className="loyalty-page__form" onSubmit={(e) => void handleLookup(e)}>
        <label htmlFor="loyalty-phone">Phone number</label>
        <input
          id="loyalty-phone"
          type="tel"
          placeholder="e.g. 01012345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button type="submit" disabled={isLoading || !phone.trim()}>
          {isLoading ? "Checking…" : "Check balance"}
        </Button>
      </form>

      {error && (
        <p className="loyalty-page__error" role="alert">
          {error}
        </p>
      )}

      {balance && (
        <div className="loyalty-page__result">
          <div className="loyalty-page__tier">{balance.tier}</div>
          <div className="loyalty-page__points">
            {balance.balance} point{balance.balance === 1 ? "" : "s"}
          </div>
          <p className="loyalty-page__lifetime">
            {balance.lifetimePoints} lifetime points · {balance.phone}
          </p>
          <p className="loyalty-page__note">
            Points expire 12 months after they are earned.
          </p>
        </div>
      )}
    </main>
  );
}
