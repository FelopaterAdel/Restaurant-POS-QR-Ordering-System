import type { TableStatus } from "@/components/ui";

export interface Table {
  id: string;
  number: number;
  name: string;
  qrCode: string;
  status: TableStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTableInput {
  number: number;
  name: string;
}

export interface UpdateTableInput {
  number?: number;
  name?: string;
}
