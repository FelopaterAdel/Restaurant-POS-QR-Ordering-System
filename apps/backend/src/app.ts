import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import authRouter from "./modules/auth/routes/auth.routes.js";
import categoryRouter from "./modules/categories/routes/category.routes.js";
import dashboardRouter from "./modules/dashboard/routes/dashboard.routes.js";
import healthRouter from "./modules/health/health.routes.js";
import publicMenuRouter from "./modules/public-menu/routes/public-menu.routes.js";
import orderRouter from "./modules/orders/routes/order.routes.js";
import orderHistoryRouter from "./modules/orders/routes/order-history.routes.js";
import orderQueueRouter from "./modules/orders/routes/order-queue.routes.js";
import publicOrderRouter from "./modules/orders/routes/public-order.routes.js";
import paymentRouter from "./modules/payments/routes/payment.routes.js";
import productRouter from "./modules/products/routes/product.routes.js";
import staffOrderRouter from "./modules/orders/routes/staff-order.routes.js";
import tableRouter from "./modules/tables/routes/table.routes.js";
import usersRouter from "./modules/users/routes/users.routes.js";

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: resolveCorsOrigins(env.corsOrigin) }));

function resolveCorsOrigins(value: string): string | string[] | boolean {
  if (value === "*") {
    return true;
  }

  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length === 1 ? origins[0] : origins;
}

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/tables", tableRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/public/tables", publicMenuRouter);
app.use("/api/v1/public/orders", publicOrderRouter);
app.use("/api/v1/orders/queue", orderQueueRouter);
app.use("/api/v1/orders/history", orderHistoryRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/orders", paymentRouter);
app.use("/api/v1/staff/orders", staffOrderRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
};

app.use(errorHandler);

export default app;
