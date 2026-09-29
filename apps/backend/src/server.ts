import app from "./app.js";
import { env } from "./config/env.js";
import { startReportScheduler } from "./infra/reports/report.scheduler.js";

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

startReportScheduler();