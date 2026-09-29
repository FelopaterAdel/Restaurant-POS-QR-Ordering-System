import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateReport, getLatestReport, listReports } from "./reports.api";

export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  latest: () => [...reportKeys.all, "latest"] as const,
};

export function useReportsQuery() {
  return useQuery({
    queryKey: reportKeys.lists(),
    queryFn: listReports,
  });
}

export function useLatestReportQuery() {
  return useQuery({
    queryKey: reportKeys.latest(),
    queryFn: getLatestReport,
    retry: false,
  });
}

export function useGenerateReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date?: string) => generateReport(date),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}
