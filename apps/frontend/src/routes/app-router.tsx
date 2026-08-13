import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { AccessDeniedPage } from "@/pages/access-denied/access-denied-page";
import { HomePage } from "@/pages/home/home-page";
import { LoginPage } from "@/pages/login/login-page";
import { NotFoundPage } from "@/pages/not-found/not-found-page";
import { PublicMenuPage } from "@/pages/public-menu/public-menu-page";
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
        element: <RoleRoute permission="dashboard" />,
        children: [
          {
            path: "/dashboard",
            element: <PagePlaceholder title="Dashboard" />,
          },
        ],
      },
      {
        element: <RoleRoute permission="orders" />,
        children: [
          {
            path: "/orders",
            element: <PagePlaceholder title="Orders" />,
          },
        ],
      },
      {
        element: <RoleRoute permission="tables" />,
        children: [
          {
            path: "/tables",
            element: <PagePlaceholder title="Tables" />,
          },
        ],
      },
      {
        element: <RoleRoute permission="products" />,
        children: [
          {
            path: "/products",
            element: <PagePlaceholder title="Products" />,
          },
        ],
      },
      {
        element: <RoleRoute permission="categories" />,
        children: [
          {
            path: "/categories",
            element: <PagePlaceholder title="Categories" />,
          },
        ],
      },
      {
        element: <RoleRoute permission="users" />,
        children: [
          {
            path: "/users",
            element: <PagePlaceholder title="Users" />,
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
