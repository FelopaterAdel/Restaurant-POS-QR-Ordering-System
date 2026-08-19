import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { DashboardPage } from "@/features/dashboard/dashboard.page";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AccessDeniedPage } from "@/pages/access-denied/access-denied-page";
import { CategoriesPage } from "@/pages/categories/categories-page";
import { HomePage } from "@/pages/home/home-page";
import { LoginPage } from "@/pages/login/login-page";
import { NotFoundPage } from "@/pages/not-found/not-found-page";
import { OrdersPage } from "@/pages/orders/orders-page";
import { ProductsPage } from "@/pages/products/products-page";
import { PublicMenuPage } from "@/pages/public-menu/public-menu-page";
import { TablesPage } from "@/pages/tables/tables-page";
import { UsersPage } from "@/pages/users/users-page";
import { GuestRoute } from "./guest-route";
import { ProtectedRoute } from "./protected-route";
import { RoleRoute } from "./role-route";

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
    element: <PublicMenuPage />,
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
                element: <PagePlaceholder title="Payments" />,
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
