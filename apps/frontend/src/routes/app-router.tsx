import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { DashboardPage } from "@/features/dashboard/dashboard.page";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AccessDeniedPage } from "@/pages/access-denied/access-denied-page";
import { CategoriesPage } from "@/features/categories";
import { HomePage } from "@/pages/home/home-page";
import { LoginPage } from "@/pages/login/login-page";
import { NotFoundPage } from "@/pages/not-found/not-found-page";
import OrdersPage from "@/features/orders/orders.page";
import OrderHistoryPage from "@/features/orders/history.page";
import KitchenPage from "@/features/kitchen/kitchen.page";
import WaiterPage from "@/features/waiter/waiter.page";
import ProductsPage from "@/features/products/products.page";
import { MenuPage } from "@/features/menu";
import OrderTrackingPage from "@/features/menu/order-tracking.page";
import MenuPreviewPage from "@/features/menu/MenuPreviewPage";
import TablesPage from "@/features/tables/tables.page";
import { UsersPage } from "@/features/users";
import { SettingsPage } from "@/features/settings";
import { PaymentsPage } from "@/features/payments";
import PaymentHistoryPage from "@/features/payments/history.page";
import { GuestRoute } from "./guest-route";
import { ProtectedRoute } from "./protected-route";
import { RoleRoute } from "./role-route";
import { KitchenRoute } from "./kitchen-route";
import { WaiterRoute } from "./waiter-route";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },
  {
    path: "/public/menu/:qrCode",
    element: <MenuPage />,
  },
  {
    path: "/public/menu/:qrCode/orders/:orderId",
    element: <OrderTrackingPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            element: <RoleRoute permission="dashboard" />,
            children: [
              {
                path: "/dashboard",
                element: <DashboardPage />,
              },
            ],
          },
          {
            element: <RoleRoute permission="orders" />,
            children: [
              {
                path: "/orders",
                element: <OrdersPage />,
              },
              {
                path: "/orders/history",
                element: <OrderHistoryPage />,
              },
            ],
          },
          {
            element: <KitchenRoute />,
            children: [
              {
                path: "/kds",
                element: <KitchenPage />,
              },
            ],
          },
          {
            element: <WaiterRoute />,
            children: [
              {
                path: "/waiter",
                element: <WaiterPage />,
              },
            ],
          },
          {
            element: <RoleRoute permission="tables" />,
            children: [
              {
                path: "/tables",
                element: <TablesPage />,
              },
            ],
          },
          {
            element: <RoleRoute permission="products" />,
            children: [
              {
                path: "/products",
                element: <ProductsPage />,
              },
            ],
          },
          {
            element: <RoleRoute permission="categories" />,
            children: [
              {
                path: "/categories",
                element: <CategoriesPage />,
              },
            ],
          },
          {
            element: <RoleRoute permission="users" />,
            children: [
              {
                path: "/users",
                element: <UsersPage />,
              },
            ],
          },
          {
            element: <RoleRoute permission="payments" />,
            children: [
              {
                path: "/payments",
                element: <PaymentsPage />,
              },
              {
                path: "/payments/history",
                element: <PaymentHistoryPage />,
              },
            ],
          },
          {
            element: <RoleRoute permission="settings" />,
            children: [
              {
                path: "/settings",
                element: <SettingsPage />,
              },
            ],
          },
          {
            element: <RoleRoute permission="categories" />,
            children: [
              {
                path: "/menu/preview",
                element: <MenuPreviewPage />,
              },
            ],
          },
        ],
      },
      {
        path: "/403",
        element: <AccessDeniedPage />,
      },
    ],
  },
  {
    path: "/404",
    element: <NotFoundPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}
