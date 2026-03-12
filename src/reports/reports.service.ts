import { Injectable, UnprocessableEntityException } from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { PrismaService } from "../prisma";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import type { CreateReportDto, CreateReportResponseDto } from "./dto";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 日報を作成する
   */
  async create(dto: CreateReportDto, user: AuthenticatedUser): Promise<CreateReportResponseDto> {
    const { report_date, visits, problems, plans } = dto;

    // 同一日付の日報重複チェック
    const existingReport = await this.prisma.dailyReport.findUnique({
      where: {
        salespersonId_reportDate: {
          salespersonId: user.id,
          reportDate: report_date,
        },
      },
    });

    if (existingReport) {
      throw new UnprocessableEntityException({
        code: "DUPLICATE_ENTRY",
        message: "この日付の日報は既に存在します",
        details: {
          report_date: ["この日付の日報は既に存在します"],
        },
      });
    }

    // 訪問記録の顧客ID存在チェック
    if (visits && visits.length > 0) {
      const customerIds = visits.map((v) => v.customer_id);
      const uniqueCustomerIds = [...new Set(customerIds)];

      const existingCustomers = await this.prisma.customer.findMany({
        where: {
          id: { in: uniqueCustomerIds },
          isActive: true,
        },
        select: { id: true },
      });

      const existingCustomerIds = existingCustomers.map((c) => c.id);
      const invalidCustomerIds = uniqueCustomerIds.filter(
        (id) => !existingCustomerIds.includes(id)
      );

      if (invalidCustomerIds.length > 0) {
        throw new UnprocessableEntityException({
          code: "VALIDATION_ERROR",
          message: "存在しない顧客IDが含まれています",
          details: {
            "visits.customer_id": [`顧客ID ${invalidCustomerIds.join(", ")} は存在しません`],
          },
        });
      }
    }

    // トランザクションで日報と関連データを一括作成
    const report = await this.prisma.$transaction(async (tx) => {
      // 日報作成
      const createdReport = await tx.dailyReport.create({
        data: {
          salespersonId: user.id,
          reportDate: report_date,
          status: "draft",
        },
      });

      // 訪問記録作成
      if (visits && visits.length > 0) {
        await tx.visit.createMany({
          data: visits.map((v) => ({
            reportId: createdReport.id,
            customerId: v.customer_id,
            visitTime: v.visit_time ? parseTime(v.visit_time) : null,
            visitPurpose: v.visit_purpose ?? null,
            visitContent: v.visit_content,
            result: v.result ?? null,
          })),
        });
      }

      // Problem作成
      if (problems && problems.length > 0) {
        await tx.problem.createMany({
          data: problems.map((p) => ({
            reportId: createdReport.id,
            content: p.content,
            priority: p.priority,
          })),
        });
      }

      // Plan作成
      if (plans && plans.length > 0) {
        await tx.plan.createMany({
          data: plans.map((p) => ({
            reportId: createdReport.id,
            content: p.content,
          })),
        });
      }

      return createdReport;
    });

    return {
      success: true,
      data: {
        report_id: report.id,
        salesperson_id: report.salespersonId,
        report_date: report.reportDate.toISOString().split("T")[0],
        status: report.status,
        created_at: report.createdAt.toISOString(),
        updated_at: report.updatedAt.toISOString(),
      },
    };
  }
}

/**
 * 時刻文字列（HH:mm）をDateオブジェクトに変換
 * PostgreSQLのTIME型用にUTC 1970-01-01の時刻として返す
 */
function parseTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
  return date;
}
