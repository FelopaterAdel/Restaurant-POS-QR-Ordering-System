import { api } from "@/lib/api";
import type { Staff, CreateStaffInput, UpdateStaffInput, StaffStatus } from "./users.types";

export async function listStaff(): Promise<Staff[]> {
  return api.get<Staff[]>("/users");
}

export async function createStaff(input: CreateStaffInput): Promise<Staff> {
  return api.post<Staff>("/users", input);
}

export async function updateStaffProfile(
  staffId: string,
  input: UpdateStaffInput,
): Promise<Staff> {
  return api.patch<Staff>(`/users/${staffId}`, input);
}

export async function updateStaffStatus(
  staffId: string,
  status: StaffStatus,
): Promise<Staff> {
  return api.patch<Staff>(`/users/${staffId}/status`, { status });
}
