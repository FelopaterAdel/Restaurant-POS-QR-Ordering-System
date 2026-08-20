import { api } from "@/lib/api";
import type { Staff, CreateStaffInput, StaffStatus } from "./users.types";

export async function listStaff(): Promise<Staff[]> {
  return api.get<Staff[]>("/users");
}

export async function createStaff(input: CreateStaffInput): Promise<Staff> {
  return api.post<Staff>("/users", input);
}

export async function updateStaffStatus(
  staffId: string,
  status: StaffStatus,
): Promise<Staff> {
  return api.patch<Staff>(`/users/${staffId}`, { status });
}
