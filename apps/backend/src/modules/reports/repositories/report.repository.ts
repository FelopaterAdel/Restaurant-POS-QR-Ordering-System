import { prisma } from "@restaurant/database";
import type { PrismaClient } from "@restaurant/database";

export interface SaveReportInput {
  date: string;
  provider: string;
  model: string;
  summary: string;
  recommendations: string[];
  data: unknown;
}

export class ReportRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async upsert(input: SaveReportInput) {
    return this.client.report.upsert({
      where: { date_provider: { date: input.date, provider: input.provider } },
      create: {
        date: input.date,
        provider: input.provider,
        model: input.model,
        summary: input.summary,
        recommendations: input.recommendations,
        data: input.data ?? {},
      },
      update: {
        model: input.model,
        summary: input.summary,
        recommendations: input.recommendations,
        data: input.data ?? {},
      },
    });
  }

  async findLatest() {
    return this.client.report.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }

  async findHistory(limit: number) {
    return this.client.report.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
