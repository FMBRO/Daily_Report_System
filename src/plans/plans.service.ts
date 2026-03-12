import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { PrismaService } from "../prisma";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import type {
  CreatePlanDto,
  UpdatePlanDto,
  PlanListResponseDto,
  PlanDetailResponseDto,
  PlanDeleteResponseDto,
  PlanDto,
} from "./dto";

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * PlanデータをDTOに変換
   */
  private toPlanDto(plan: {
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    _count: { comments: number };
  }): PlanDto {
    return {
      plan_id: plan.id,
      content: plan.content,
      comment_count: plan._count.comments,
      created_at: plan.createdAt.toISOString(),
      updated_at: plan.updatedAt.toISOString(),
    };
  }

  /**
   * 日報の所有権と編集可能状態をチェック
   */
  private async checkReportAccess(
    reportId: number,
    user: AuthenticatedUser,
    requireEditable: boolean = false
  ): Promise<{ salespersonId: number; status: string }> {
    const report = await this.prisma.dailyReport.findUnique({
      where: { id: reportId },
      select: {
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

    // 所有権チェック（adminは全員の日報にアクセス可能）
    if (user.role !== "admin" && report.salespersonId !== user.id) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "この日報にアクセスする権限がありません",
      });
    }

    // 編集可能状態チェック
    if (requireEditable && report.status === "submitted") {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "提出済みの日報は編集できません",
      });
    }

    return report;
  }

  /**
   * Planの所有権チェック
   */
  private async checkPlanAccess(
    planId: number,
    user: AuthenticatedUser,
    requireEditable: boolean = false
  ): Promise<{
    id: number;
    reportId: number;
    report: { salespersonId: number; status: string };
  }> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        reportId: true,
        dailyReport: {
          select: {
            salespersonId: true,
            status: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "計画が見つかりません",
      });
    }

    // 所有権チェック（adminは全員の日報にアクセス可能）
    if (user.role !== "admin" && plan.dailyReport.salespersonId !== user.id) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "この計画にアクセスする権限がありません",
      });
    }

    // 編集可能状態チェック
    if (requireEditable && plan.dailyReport.status === "submitted") {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "提出済みの日報は編集できません",
      });
    }

    return {
      id: plan.id,
      reportId: plan.reportId,
      report: plan.dailyReport,
    };
  }

  /**
   * Plan一覧を取得する
   */
  async findAll(reportId: number, user: AuthenticatedUser): Promise<PlanListResponseDto> {
    // 日報のアクセス権チェック
    await this.checkReportAccess(reportId, user);

    // Planを取得
    const plans = await this.prisma.plan.findMany({
      where: { reportId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { id: "asc" },
    });

    return {
      success: true,
      data: plans.map((p) => this.toPlanDto(p)),
    };
  }

  /**
   * Planを作成する
   */
  async create(
    reportId: number,
    dto: CreatePlanDto,
    user: AuthenticatedUser
  ): Promise<PlanDetailResponseDto> {
    // 日報のアクセス権と編集可能状態チェック
    await this.checkReportAccess(reportId, user, true);

    // Planを作成
    const plan = await this.prisma.plan.create({
      data: {
        reportId,
        content: dto.content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    return {
      success: true,
      data: this.toPlanDto(plan),
    };
  }

  /**
   * Planを更新する
   */
  async update(
    planId: number,
    dto: UpdatePlanDto,
    user: AuthenticatedUser
  ): Promise<PlanDetailResponseDto> {
    // Planのアクセス権と編集可能状態チェック
    await this.checkPlanAccess(planId, user, true);

    // 更新データの構築
    const updateData: {
      content?: string;
    } = {};

    if (dto.content !== undefined) {
      updateData.content = dto.content;
    }

    // Planを更新
    const plan = await this.prisma.plan.update({
      where: { id: planId },
      data: updateData,
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    return {
      success: true,
      data: this.toPlanDto(plan),
    };
  }

  /**
   * Planを削除する（関連コメントもカスケード削除）
   */
  async remove(planId: number, user: AuthenticatedUser): Promise<PlanDeleteResponseDto> {
    // Planのアクセス権と編集可能状態チェック
    await this.checkPlanAccess(planId, user, true);

    // Planを削除（コメントはDBのカスケード削除で自動削除）
    await this.prisma.plan.delete({
      where: { id: planId },
    });

    return {
      success: true,
      message: "計画を削除しました",
    };
  }
}
