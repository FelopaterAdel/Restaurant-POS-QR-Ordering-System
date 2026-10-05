import type { RestaurantTable, TableStatus } from "@restaurant/database";
import { env } from "../../../config/env.js";

export interface TableDto {
  id: string;
  number: number;
  name: string;
  qrCode: string;
  status: TableStatus;
  menuUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export function buildTableMenuUrl(qrCode: string): string {
  return `${env.frontendBaseUrl}/public/menu/${qrCode}`;
}

export function toTableDto(table: RestaurantTable): TableDto {
  return {
    id: table.id,
    number: table.number,
    name: table.name,
    qrCode: table.qrCode,
    status: table.status,
    menuUrl: buildTableMenuUrl(table.qrCode),
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
  };
}
