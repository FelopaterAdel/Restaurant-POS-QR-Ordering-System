import { useQuery } from "@tanstack/react-query";
import { listStaff } from "./users.api";

export const staffKeys = {
  all: ["staff"] as const,
  lists: () => [...staffKeys.all, "list"] as const,
  list: () => [...staffKeys.lists()] as const,
};

export function useStaffQuery() {
  return useQuery({
    queryKey: staffKeys.list(),
    queryFn: listStaff,
  });
}
