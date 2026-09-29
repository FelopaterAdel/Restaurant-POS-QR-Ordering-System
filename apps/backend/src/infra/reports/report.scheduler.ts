import cron, { type ScheduledTask } from "node-cron";
import { env } from "../../config/env.js";
import { RESTAURANT_TIMEZONE } from "../../config/restaurant.js";
import { GenerateDailyReportUseCase } from "../../modules/reports/use-cases/generate-daily-report.use-case.js";

/**
 * Schedules the daily AI sales report. Started from server.ts only, so
 * tests and one-off scripts never spawn the job.
 */
export function startReportScheduler(
  generateUseCase: Pick<
    GenerateDailyReportUseCase,
    "execute"
  > = new GenerateDailyReportUseCase(),
): ScheduledTask {
  const task = cron.schedule(
    env.reports.cron,
    async () => {
      try {
        const report = await generateUseCase.execute({});
        console.log(
          `Daily sales report generated for ${report.date} (${report.provider}/${report.model})`,
        );
      } catch (error) {
        console.error("Daily sales report failed", error);
      }
    },
    { timezone: RESTAURANT_TIMEZONE },
  );

  task.start();
  return task;
}
