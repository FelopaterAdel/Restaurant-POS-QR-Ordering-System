import express, { type ErrorRequestHandler } from "express";
import authRouter from "./modules/auth/routes/auth.routes.js";
import healthRouter from "./modules/health/health.routes.js";
import usersRouter from "./modules/users/routes/users.routes.js";

const app = express();
app.use(express.json());
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
};

app.use(errorHandler);

export default app;
