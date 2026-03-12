import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import type { Priority } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { PrismaService } from "../prisma";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import type {
  CreateProblemDto,
  UpdateProblemDto,
  ProblemListResponseDto,
  ProblemDetailResponseDto,
  ProblemDeleteResponseDto,
  ProblemDto,
} from "./dto";

@Injectable()
export class ProblemsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ProblemデータをDTOに変換
   */
  private toProblemDto(problem: {
    id: number;
    content: string;
    priority: Priority;
    createdAt: Date;
    updatedAt: Date;
    _count: { comments: number };
  }): ProblemDto {
    return {
      problem_id: problem.id,
      content: problem.content,
      priority: problem.priority,
      comment_count: problem._count.comments,
      created_at: problem.createdAt.toISOString(),
      updated_at: problem.updatedAt.toISOString(),
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
   * Problemの所有権チェック
   */
  private async checkProblemAccess(
    problemId: number,
    user: AuthenticatedUser,
    requireEditable: boolean = false
  ): Promise<{
    id: number;
    reportId: number;
    report: { salespersonId: number; status: string };
  }> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
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

    if (!problem) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "課題・相談が見つかりません",
      });
    }

    // 所有権チェック（adminは全員の日報にアクセス可能）
    if (user.role !== "admin" && problem.dailyReport.salespersonId !== user.id) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "この課題・相談にアクセスする権限がありません",
      });
    }

    // 編集可能状態チェック
    if (requireEditable && problem.dailyReport.status === "submitted") {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "提出済みの日報は編集できません",
      });
    }

    return {
      id: problem.id,
      reportId: problem.reportId,
      report: problem.dailyReport,
    };
  }

  /**
   * Problem一覧を取得する
   */
  async findAll(reportId: number, user: AuthenticatedUser): Promise<ProblemListResponseDto> {
    // 日報のアクセス権チェック
    await this.checkReportAccess(reportId, user);

    // Problemを取得
    const problems = await this.prisma.problem.findMany({
      where: { reportId },
      select: {
        id: true,
        content: true,
        priority: true,
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
      data: problems.map((p) => this.toProblemDto(p)),
    };
  }

  /**
   * Problemを作成する
   */
  async create(
    reportId: number,
    dto: CreateProblemDto,
    user: AuthenticatedUser
  ): Promise<ProblemDetailResponseDto> {
    // 日報のアクセス権と編集可能状態チェック
    await this.checkReportAccess(reportId, user, true);

    // Problemを作成
    const problem = await this.prisma.problem.create({
      data: {
        reportId,
        content: dto.content,
        priority: dto.priority as Priority,
      },
      select: {
        id: true,
        content: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    return {
      success: true,
      data: this.toProblemDto(problem),
    };
  }

  /**
   * Problemを更新する
   */
  async update(
    problemId: number,
    dto: UpdateProblemDto,
    user: AuthenticatedUser
  ): Promise<ProblemDetailResponseDto> {
    // Problemのアクセス権と編集可能状態チェック
    await this.checkProblemAccess(problemId, user, true);

    // 更新データの構築
    const updateData: {
      content?: string;
      priority?: Priority;
    } = {};

    if (dto.content !== undefined) {
      updateData.content = dto.content;
    }
    if (dto.priority !== undefined) {
      updateData.priority = dto.priority as Priority;
    }

    // Problemを更新
    const problem = await this.prisma.problem.update({
      where: { id: problemId },
      data: updateData,
      select: {
        id: true,
        content: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    return {
      success: true,
      data: this.toProblemDto(problem),
    };
  }

  /**
   * Problemを削除する（関連コメントもカスケード削除）
   */
  async remove(problemId: number, user: AuthenticatedUser): Promise<ProblemDeleteResponseDto> {
    // Problemのアクセス権と編集可能状態チェック
    await this.checkProblemAccess(problemId, user, true);

    // Problemを削除（コメントはDBのカスケード削除で自動削除）
    await this.prisma.problem.delete({
      where: { id: problemId },
    });

    return {
      success: true,
      message: "課題・相談を削除しました",
    };
  }
}
