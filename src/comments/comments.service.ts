import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import type { CommentTargetType } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { PrismaService } from "../prisma";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import type {
  CreateCommentDto,
  CommentListResponseDto,
  CommentDetailResponseDto,
  CommentDeleteResponseDto,
  CommentDto,
} from "./dto";

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * CommentデータをDTOに変換
   */
  private toCommentDto(comment: {
    id: number;
    content: string;
    createdAt: Date;
    commenter: { id: number; name: string };
  }): CommentDto {
    return {
      comment_id: comment.id,
      commenter: {
        salesperson_id: comment.commenter.id,
        name: comment.commenter.name,
      },
      content: comment.content,
      created_at: comment.createdAt.toISOString(),
    };
  }

  /**
   * 上長がコメント可能かどうかをチェック
   * managerは部下の日報にのみコメント可能
   * adminは全ての日報にコメント可能
   */
  private async checkCommentPermission(
    reportSalespersonId: number,
    user: AuthenticatedUser
  ): Promise<void> {
    // salesはコメント投稿不可
    if (user.role === "sales") {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "営業担当者はコメントを投稿できません",
      });
    }

    // adminは全ての日報にコメント可能
    if (user.role === "admin") {
      return;
    }

    // managerは部下の日報にのみコメント可能
    if (user.role === "manager") {
      // 自分の部下かどうかを確認
      const subordinate = await this.prisma.salesperson.findFirst({
        where: {
          id: reportSalespersonId,
          managerId: user.id,
        },
      });

      if (!subordinate) {
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message: "担当外の日報にはコメントできません",
        });
      }
    }
  }

  /**
   * 日報の閲覧権限チェック
   */
  private async checkReportViewAccess(
    reportSalespersonId: number,
    user: AuthenticatedUser
  ): Promise<void> {
    // adminは全ての日報を閲覧可能
    if (user.role === "admin") {
      return;
    }

    // salesは自分の日報のみ閲覧可能
    if (user.role === "sales") {
      if (reportSalespersonId !== user.id) {
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message: "この日報にアクセスする権限がありません",
        });
      }
      return;
    }

    // managerは自分の日報と部下の日報を閲覧可能
    if (user.role === "manager") {
      if (reportSalespersonId === user.id) {
        return;
      }

      const subordinate = await this.prisma.salesperson.findFirst({
        where: {
          id: reportSalespersonId,
          managerId: user.id,
        },
      });

      if (!subordinate) {
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message: "この日報にアクセスする権限がありません",
        });
      }
    }
  }

  /**
   * Problemのコメント一覧を取得する
   */
  async findByProblem(problemId: number, user: AuthenticatedUser): Promise<CommentListResponseDto> {
    // Problemの存在確認と日報情報取得
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        dailyReport: {
          select: {
            salespersonId: true,
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

    // 閲覧権限チェック
    await this.checkReportViewAccess(problem.dailyReport.salespersonId, user);

    // コメントを取得
    const comments = await this.prisma.comment.findMany({
      where: {
        targetType: "problem" as CommentTargetType,
        targetId: problemId,
      },
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
    });

    return {
      success: true,
      data: comments.map((c) => this.toCommentDto(c)),
    };
  }

  /**
   * Problemにコメントを投稿する
   */
  async createForProblem(
    problemId: number,
    dto: CreateCommentDto,
    user: AuthenticatedUser
  ): Promise<CommentDetailResponseDto> {
    // Problemの存在確認と日報情報取得
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        dailyReport: {
          select: {
            salespersonId: true,
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

    // コメント投稿権限チェック
    await this.checkCommentPermission(problem.dailyReport.salespersonId, user);

    // コメントを作成
    const comment = await this.prisma.comment.create({
      data: {
        targetType: "problem" as CommentTargetType,
        targetId: problemId,
        problemId: problemId,
        commenterId: user.id,
        content: dto.content,
      },
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
    });

    return {
      success: true,
      data: this.toCommentDto(comment),
    };
  }

  /**
   * Planのコメント一覧を取得する
   */
  async findByPlan(planId: number, user: AuthenticatedUser): Promise<CommentListResponseDto> {
    // Planの存在確認と日報情報取得
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      select: {
        dailyReport: {
          select: {
            salespersonId: true,
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

    // 閲覧権限チェック
    await this.checkReportViewAccess(plan.dailyReport.salespersonId, user);

    // コメントを取得
    const comments = await this.prisma.comment.findMany({
      where: {
        targetType: "plan" as CommentTargetType,
        targetId: planId,
      },
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
    });

    return {
      success: true,
      data: comments.map((c) => this.toCommentDto(c)),
    };
  }

  /**
   * Planにコメントを投稿する
   */
  async createForPlan(
    planId: number,
    dto: CreateCommentDto,
    user: AuthenticatedUser
  ): Promise<CommentDetailResponseDto> {
    // Planの存在確認と日報情報取得
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      select: {
        dailyReport: {
          select: {
            salespersonId: true,
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

    // コメント投稿権限チェック
    await this.checkCommentPermission(plan.dailyReport.salespersonId, user);

    // コメントを作成
    const comment = await this.prisma.comment.create({
      data: {
        targetType: "plan" as CommentTargetType,
        targetId: planId,
        planId: planId,
        commenterId: user.id,
        content: dto.content,
      },
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
    });

    return {
      success: true,
      data: this.toCommentDto(comment),
    };
  }

  /**
   * コメントを削除する
   * managerは自分のコメントのみ削除可能
   * adminは全てのコメントを削除可能
   */
  async remove(commentId: number, user: AuthenticatedUser): Promise<CommentDeleteResponseDto> {
    // コメントの存在確認
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        commenterId: true,
      },
    });

    if (!comment) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "コメントが見つかりません",
      });
    }

    // salesはコメント削除不可
    if (user.role === "sales") {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "営業担当者はコメントを削除できません",
      });
    }

    // managerは自分のコメントのみ削除可能
    if (user.role === "manager" && comment.commenterId !== user.id) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "他のユーザーのコメントは削除できません",
      });
    }

    // コメントを削除
    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return {
      success: true,
      data: {
        message: "コメントを削除しました",
      },
    };
  }
}
