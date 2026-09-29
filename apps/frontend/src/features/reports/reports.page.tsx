import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { ApiError } from "@/lib/api";
import {
  useGenerateReportMutation,
  useLatestReportQuery,
  useReportsQuery,
} from "./reports.queries";
import type { SalesReport } from "./reports.types";
import "./reports.css";

function ReportCard({ report }: { report: SalesReport }) {
  return (
    <Card>
      <CardBody>
        <div className="report-card__head">
          <CardTitle>Report for {report.date}</CardTitle>
          <span className="report-card__meta">
            {report.provider}/{report.model}
          </span>
        </div>
        <p className="report-card__summary">{report.summary}</p>
        <h3 className="report-card__reco-title">Recommendations</h3>
        <ul className="report-card__reco-list">
          {report.recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

export default function ReportsPage() {
  const [date, setDate] = useState("");
  const [generateError, setGenerateError] = useState<string | null>(null);

  const latest = useLatestReportQuery();
  const history = useReportsQuery();
  const generate = useGenerateReportMutation();

  const latestMissing =
    latest.error instanceof ApiError && latest.error.status === 404;

  async function handleGenerate() {
    setGenerateError(null);
    try {
      await generate.mutateAsync(date || undefined);
      setDate("");
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.code === "AI_PROVIDER_NOT_CONFIGURED"
      ) {
        setGenerateError(
          "AI generation isn't configured. Add an ANTHROPIC_API_KEY on the server first.",
        );
      } else {
        setGenerateError(
          err instanceof ApiError ? err.message : "Generation failed.",
        );
      }
    }
  }

  return (
    <div className="reports">
      <div className="reports__header">
        <h1 className="reports__title">AI Sales Reports</h1>
        <div className="reports__actions">
          <input
            type="date"
            aria-label="Report date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button onClick={() => void handleGenerate()} disabled={generate.isPending}>
            {generate.isPending ? "Generating…" : "Generate report"}
          </Button>
        </div>
      </div>

      {generateError && (
        <p className="reports__error" role="alert">
          {generateError}
        </p>
      )}

      {latest.isLoading ? (
        <p>Loading latest report…</p>
      ) : latest.data ? (
        <section aria-label="Latest report">
          <ReportCard report={latest.data} />
        </section>
      ) : latestMissing ? (
        <EmptyState
          title="No reports yet"
          description="Generate your first AI sales report for yesterday's performance."
          action={
            <Button
              onClick={() => void handleGenerate()}
              disabled={generate.isPending}
            >
              Generate report
            </Button>
          }
        />
      ) : (
        latest.error && (
          <ErrorState
            title="Failed to load the latest report"
            description={latest.error.message}
            action={
              <Button onClick={() => void latest.refetch()}>Try again</Button>
            }
          />
        )
      )}

      <section aria-label="Report history">
        <h2 className="reports__subtitle">History</h2>
        {history.isLoading ? (
          <p>Loading history…</p>
        ) : !history.data || history.data.length === 0 ? (
          <p className="reports__muted">No past reports.</p>
        ) : (
          <ul className="reports__history">
            {history.data.map((report) => (
              <li key={report.id} className="reports__history-item">
                <span>{report.date}</span>
                <span className="reports__muted">
                  {`${report.recommendations.length} recommendations`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
