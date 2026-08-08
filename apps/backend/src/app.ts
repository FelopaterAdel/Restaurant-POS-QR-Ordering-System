import express, { type ErrorRequestHandler } from "express";
import authRouter from "./modules/auth/routes/auth.routes.js";
import categoryRouter from "./modules/categories/routes/category.routes.js";
import healthRouter from "./modules/health/health.routes.js";
import publicMenuRouter from "./modules/public-menu/routes/public-menu.routes.js";
import publicOrderRouter from "./modules/orders/routes/public-order.routes.js";
import productRouter from "./modules/products/routes/product.routes.js";
import tableRouter from "./modules/tables/routes/table.routes.js";
import usersRouter from "./modules/users/routes/users.routes.js";

const app = express();
app.use(express.json());
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/tables", tableRouter);
app.use("/api/v1/public/menu", publicMenuRouter);
app.use("/api/v1/public/orders", publicOrderRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
};

app.use(errorHandler);

export default app;
