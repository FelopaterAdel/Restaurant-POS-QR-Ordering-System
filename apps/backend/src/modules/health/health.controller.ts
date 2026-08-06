import { getHealthStatus } from "./health.service.js";

export function getHealth(_req: unknown, res: { json: (body: unknown) => void }) {
  const status = getHealthStatus();
  res.json(status);
}
