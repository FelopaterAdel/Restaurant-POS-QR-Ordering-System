import { NotFoundError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { ReportRepository } from "../repositories/report.repository.js";

export class ReportNotFoundError extends NotFoundError {
  constructor() {
    super(AppErrorCode.REPORT_NOT_FOUND, "Report not found");
    this.name = "ReportNotFoundError";
  }
}

export class ListReportsUseCase {
  private readonly reportRepository: ReportRepository;

  constructor(reportRepository: ReportRepository = new ReportRepository()) {
    this.reportRepository = reportRepository;
  }

  async execute(limit = 30) {
    return this.reportRepository.findHistory(limit);
  }
}

export class GetLatestReportUseCase {
  private readonly reportRepository: ReportRepository;

  constructor(reportRepository: ReportRepository = new ReportRepository()) {
    this.reportRepository = reportRepository;
  }

  async execute() {
    const report = await this.reportRepository.findLatest();
    if (!report) {
      throw new ReportNotFoundError();
    }
    return report;
  }
}
