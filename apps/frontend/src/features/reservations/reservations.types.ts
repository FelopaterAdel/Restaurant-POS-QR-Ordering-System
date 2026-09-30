export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SEATED"
  | "CANCELLED"
  | "COMPLETED";

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  tableId: string;
  reservedFor: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  table?: {
    id: string;
    number: number;
    name: string;
  };
}

export interface CreateReservationInput {
  customerName: string;
  phone: string;
  partySize: number;
  tableId: string;
  reservedFor: string;
}

export interface UpdateReservationInput {
  customerName?: string;
  phone?: string;
  partySize?: number;
  tableId?: string;
  reservedFor?: string;
}
