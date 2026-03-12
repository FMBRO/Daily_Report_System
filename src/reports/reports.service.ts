import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { PrismaService } from "../prisma";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import type {
  ReportQueryDto,
  ReportListResponseDto,
  ReportDetailResponseDto,
  ReportListItemDto,
  ReportDetailDto,
  VisitDetailDto,
  ProblemDetailDto,
  PlanDetailDto,
  CommentDto,
  SubmitReportResponseDto,
} from "./dto";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 部下IDを再帰的に取得する
   */
  private async getSubordinateIds(managerId: number): Promise<number[]> {
    const subordinateIds: number[] = [];

    const getSubordinatesRecursive = async (id: number): Promise<void> => {
      const subordinates = await this.prisma.salesperson.findMany({
        where: {
          managerId: id,
          isActive: true,
        },
        select: { id: true },
      });

      for (const sub of subordinates) {
        subordinateIds.push(sub.id);
        await getSubordinatesRecursive(sub.id);
      }
    };

    await getSubordinatesRecursive(managerId);
    return subordinateIds;
  }

  /**
   * 閲覧可能な営業担当者IDのリストを取得
   */
  private async getAccessibleSalespersonIds(user: AuthenticatedUser): Promise<number[] | null> {
    // adminは全員閲覧可能
    if (user.role === "admin") {
      return null; // null = 制限なし
    }

    // salesは自分のみ
    if (user.role === "sales") {
      return [user.id];
    }

    // managerは自分＋部下
    const subordinateIds = await this.getSubordinateIds(user.id);
    return [user.id, ...subordinateIds];
  }

  /**
   * 日報一覧を取得する
   */
  async findAll(query: ReportQueryDto, user: AuthenticatedUser): Promise<ReportListResponseDto> {
    const { salesperson_id, date_from, date_to, status, page = 1, per_page = 20 } = query;

    // 閲覧可能な営業担当者IDを取得
    const accessibleIds = await this.getAccessibleSalespersonIds(user);

    // WHERE条件の構築
    const where: Prisma.DailyReportWhereInput = {};

    // salesperson_idフィルタ
    if (salesperson_id !== undefined) {
      // 指定された営業担当者が閲覧可能かチェック
      if (accessibleIds !== null && !accessibleIds.includes(salesperson_id)) {
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message: "この営業担当者の日報を閲覧する権限がありません",
        });
      }
      where.salespersonId = salesperson_id;
    } else if (accessibleIds !== null) {
      // フィルタなしの場合は閲覧可能な全員
      where.salespersonId = { in: accessibleIds };
    }

    // 日付範囲フィルタ
    if (date_from || date_to) {
      where.reportDate = {};
      if (date_from) {
        where.reportDate.gte = date_from;
      }
      if (date_to) {
        where.reportDate.lte = date_to;
      }
    }

    // ステータスフィルタ
    if (status) {
      where.status = status;
    }

    // 総件数取得
    const totalCount = await this.prisma.dailyReport.count({ where });

    // ページネーション計算
    const totalPages = Math.ceil(totalCount / per_page);
    const skip = (page - 1) * per_page;

    // データ取得
    const reports = await this.prisma.dailyReport.findMany({
      where,
      select: {
        id: true,
        reportDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        salesperson: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            visits: true,
            problems: true,
            plans: true,
          },
        },
      },
      orderBy: [{ reportDate: "desc" }, { id: "desc" }],
      skip,
      take: per_page,
    });

    // レスポンス形式に変換
    const data: ReportListItemDto[] = reports.map((r) => ({
      report_id: r.id,
      salesperson: {
        salesperson_id: r.salesperson.id,
        name: r.salesperson.name,
      },
      report_date: r.reportDate.toISOString().split("T")[0],
      status: r.status,
      visit_count: r._count.visits,
      problem_count: r._count.problems,
      plan_count: r._count.plans,
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    }));

    return {
      success: true,
      data,
      pagination: {
        current_page: page,
        per_page,
        total_pages: totalPages,
        total_count: totalCount,
      },
    };
  }

  /**
   * 日報詳細を取得する
   */
  async findOne(id: number, user: AuthenticatedUser): Promise<ReportDetailResponseDto> {
    // 日報取得
    const report = await this.prisma.dailyReport.findUnique({
      where: { id },
      select: {
        id: true,
        reportDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        salespersonId: true,
        salesperson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        visits: {
          select: {
            id: true,
            visitTime: true,
            visitPurpose: true,
            visitContent: true,
            result: true,
            customer: {
              select: {
                id: true,
                customerName: true,
              },
            },
          },
          orderBy: { id: "asc" },
        },
        problems: {
          select: {
            id: true,
            content: true,
            priority: true,
            comments: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                commenter: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { id: "asc" },
        },
        plans: {
          select: {
            id: true,
            content: true,
            comments: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                commenter: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!report) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "日報が見つかりません",
      });
    }

    // 権限チェック
    const accessibleIds = await this.getAccessibleSalespersonIds(user);
    if (accessibleIds !== null && !accessibleIds.includes(report.salespersonId)) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "この日報を閲覧する権限がありません",
      });
    }

    // 訪問データの変換
    const visits: VisitDetailDto[] = report.visits.map((v) => ({
      visit_id: v.id,
      customer: {
        customer_id: v.customer.id,
        customer_name: v.customer.customerName,
      },
      visit_time: v.visitTime ? formatTime(v.visitTime) : null,
      visit_purpose: v.visitPurpose,
      visit_content: v.visitContent,
      result: v.result,
    }));

    // Problemデータの変換
    const problems: ProblemDetailDto[] = report.problems.map((p) => ({
      problem_id: p.id,
      content: p.content,
      priority: p.priority,
      comments: p.comments.map(
        (c): CommentDto => ({
          comment_id: c.id,
          commenter: {
            salesperson_id: c.commenter.id,
            name: c.commenter.name,
          },
          content: c.content,
          created_at: c.createdAt.toISOString(),
        })
      ),
    }));

    // Planデータの変換
    const plans: PlanDetailDto[] = report.plans.map((p) => ({
      plan_id: p.id,
      content: p.content,
      comments: p.comments.map(
        (c): CommentDto => ({
          comment_id: c.id,
          commenter: {
            salesperson_id: c.commenter.id,
            name: c.commenter.name,
          },
          content: c.content,
          created_at: c.createdAt.toISOString(),
        })
      ),
    }));

    // レスポンス形式に変換
    const data: ReportDetailDto = {
      report_id: report.id,
      salesperson: {
        salesperson_id: report.salesperson.id,
        name: report.salesperson.name,
        email: report.salesperson.email,
      },
      report_date: report.reportDate.toISOString().split("T")[0],
      status: report.status,
      visits,
      problems,
      plans,
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
    };

    return {
      success: true,
      data,
    };
  }

  /**
   * 日報を提出する
   */
  async submit(id: number, user: AuthenticatedUser): Promise<SubmitReportResponseDto> {
    // 日報取得
    const report = await this.prisma.dailyReport.findUnique({
      where: { id },
      select: {
        id: true,
        salespersonId: true,
        status: true,
      },
    });

    if (!report) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "日報が見つかりません",
      });
    }

    // 権限チェック（自分の日報のみ提出可能）
    if (report.salespersonId !== user.id) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "この日報を提出する権限がありません",
      });
    }

    // 既に提出済みの場合はエラー
    if (report.status === "submitted") {
      throw new UnprocessableEntityException({
        code: "ALREADY_SUBMITTED",
        message: "この日報は既に提出済みです",
      });
    }

    // ステータスを更新
    const updatedReport = await this.prisma.dailyReport.update({
      where: { id },
      data: { status: "submitted" },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: {
        report_id: updatedReport.id,
        status: "submitted",
        submitted_at: updatedReport.updatedAt.toISOString(),
      },
    };
  }
}

/**
 * 時刻をHH:mm形式でフォーマット
 */
function formatTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
