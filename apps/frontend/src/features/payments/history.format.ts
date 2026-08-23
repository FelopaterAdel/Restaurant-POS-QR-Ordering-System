export function formatCurrency(value: number): string {
  return `EGP ${value.toLocaleString("en-US")}`;
}

export function formatPaidAt(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${day} ${month} ${year}, ${time}`;
}
