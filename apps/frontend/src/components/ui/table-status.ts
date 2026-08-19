export const TABLE_STATUSES = ["AVAILABLE", "OCCUPIED", "DISABLED"] as const;

export type TableStatus = (typeof TABLE_STATUSES)[number];
