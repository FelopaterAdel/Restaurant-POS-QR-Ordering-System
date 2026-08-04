import express from "express";
import healthRouter from "./modules/health/health.routes.js";

const app = express();
app.use(express.json());
app.use("/api/v1/health", healthRouter);

export default app;