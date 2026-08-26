import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "@/app/App";
import { AuthProvider } from "@/features/auth";
import { RestaurantProvider } from "@/features/settings";
import { NotificationsProvider } from "@/features/notifications";
import { apiNotificationAdapter } from "@/features/notifications/api/api.adapter";
import { initTheme } from "@/theme";
import "@/assets/styles/index.css";

initTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RestaurantProvider>
          <NotificationsProvider adapter={apiNotificationAdapter}>
            <App />
          </NotificationsProvider>
        </RestaurantProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
