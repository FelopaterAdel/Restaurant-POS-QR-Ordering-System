import { api } from "@/lib/api";
import type { Staff, CreateStaffInput } from "./users.types";

export async function listStaff(): Promise<Staff[]> {
  return api.get<Staff[]>("/users");
}

export async function createStaff(input: CreateStaffInput): Promise<Staff> {
  return api.post<Staff>("/users", input);
}
