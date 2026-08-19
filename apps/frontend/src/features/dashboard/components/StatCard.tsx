import type { ReactNode } from "react";
import { Card, CardBody } from "@/components/ui";

export type StatCardTone =
  "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: StatCardTone;
}

export function StatCard({
  title,
  value,
  hint,
  icon,
  tone = "neutral",
}: StatCardProps) {
  return (
    <Card>
      <CardBody className="stat-card">
        <div className="stat-card__header">
          <span className="stat-card__title">{title}</span>
          {icon && (
            <span className={`stat-card__icon stat-card__icon--${tone}`}>
              {icon}
            </span>
          )}
        </div>
        <p className="stat-card__value">{value}</p>
        {hint && <p className="stat-card__hint">{hint}</p>}
      </CardBody>
    </Card>
  );
}
