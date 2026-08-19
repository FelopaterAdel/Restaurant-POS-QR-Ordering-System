import { useQuery } from "@tanstack/react-query";
import { getPublicMenu } from "./menu.api";

export const menuKeys = {
  all: ["public-menu"] as const,
  menu: (qrCode: string) => [...menuKeys.all, qrCode] as const,
};

export function usePublicMenuQuery(qrCode: string) {
  return useQuery({
    queryKey: menuKeys.menu(qrCode),
    queryFn: () => getPublicMenu(qrCode),
    enabled: qrCode.length > 0,
    retry: false,
  });
}
