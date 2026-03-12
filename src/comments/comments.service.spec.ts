import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommentsService } from "./comments.service";
import type { PrismaService } from "../prisma";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

describe("CommentsService", () => {
  let commentsService: CommentsService;

  const mockSalesUser: AuthenticatedUser = {
    id: 1,
    email: "tanaka@example.com",
    name: "田中 太郎",
    role: "sales" as const,
  };

  const mockManagerUser: AuthenticatedUser = {
    id: 10,
    email: "suzuki@example.com",
    name: "鈴木 部長",
    role: "manager" as const,
  };

  const mockAdminUser: AuthenticatedUser = {
    id: 99,
    email: "admin@example.com",
    name: "Admin",
    role: "admin" as const,
  };

  const mockPrismaService = {
    problem: {
      findUnique: vi.fn(),
    },
    plan: {
      findUnique: vi.fn(),
    },
    comment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    salesperson: {
      findFirst: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    commentsService = new CommentsService(mockPrismaService as unknown as PrismaService);
  });

  describe("findByProblem", () => {
    // CMT-010: Problemコメント取得
    it("CMT-010: Problemのコメント一覧を取得できる", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        dailyReport: {
          salespersonId: 1,
        },
      });

      const mockComments = [
        {
          id: 1,
          content: "この件について対応策を考えましょう",
          createdAt: new Date("2026-02-15T10:30:00Z"),
          commenter: {
            id: 10,
            name: "鈴木 部長",
          },
        },
      ];

      mockPrismaService.comment.findMany.mockResolvedValue(mockComments);

      const result = await commentsService.findByProblem(1, mockSalesUser);

      expect(result).toEqual({
        success: true,
        data: [
          {
            comment_id: 1,
            commenter: {
              salesperson_id: 10,
              name: "鈴木 部長",
            },
            content: "この件について対応策を考えましょう",
            created_at: "2026-02-15T10:30:00.000Z",
          },
        ],
      });
    });

    // CMT-012: コメントなしの取得
    it("CMT-012: コメントがない場合は空配列を返す", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        dailyReport: {
          salespersonId: 1,
        },
      });

      mockPrismaService.comment.findMany.mockResolvedValue([]);

      const result = await commentsService.findByProblem(1, mockSalesUser);

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });

    it("存在しないProblemで404エラー", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(null);

      await expect(commentsService.findByProblem(999, mockSalesUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it("営業は自分の日報のコメントのみ閲覧可能", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        dailyReport: {
          salespersonId: 999, // 他人のID
        },
      });

      await expect(commentsService.findByProblem(1, mockSalesUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it("マネージャーは部下の日報のコメントを閲覧可能", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        dailyReport: {
          salespersonId: 1, // 部下のID
        },
      });

      mockPrismaService.salesperson.findFirst.mockResolvedValue({
        id: 1,
        managerId: 10, // マネージャーのID
      });

      mockPrismaService.comment.findMany.mockResolvedValue([]);

      const result = await commentsService.findByProblem(1, mockManagerUser);

      expect(result.success).toBe(true);
    });
  });

  describe("createForProblem", () => {
    // CMT-001: Problemへのコメント（上長）
    it("CMT-001: マネージャーは部下の日報のProblemにコメントできる", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        dailyReport: {
          salespersonId: 1,
        },
      });

      // 部下かどうかの確認
      mockPrismaService.salesperson.findFirst.mockResolvedValue({
        id: 1,
        managerId: 10,
      });

      const mockCreatedComment = {
        id: 1,
        content: "この件について対応策を考えましょう",
        createdAt: new Date("2026-02-15T10:30:00Z"),
        commenter: {
          id: 10,
          name: "鈴木 部長",
        },
      };

      mockPrismaService.comment.create.mockResolvedValue(mockCreatedComment);

      const result = await commentsService.createForProblem(
        1,
        { content: "この件について対応策を考えましょう" },
        mockManagerUser
      );

      expect(result.success).toBe(true);
      expect(result.data.comment_id).toBe(1);
      expect(result.data.commenter.salesperson_id).toBe(10);
    });

    // CMT-004: 営業によるコメント（403エラー）
    it("CMT-004: 営業担当者はコメントを投稿できない", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        dailyReport: {
          salespersonId: 1,
        },
      });

      await expect(
        commentsService.createForProblem(1, { content: "コメント" }, mockSalesUser)
      ).rejects.toThrow(ForbiddenException);
    });

    // CMT-006: 担当外へのコメント（403エラー）
    it("CMT-006: マネージャーは担当外の日報にコメントできない", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        dailyReport: {
          salespersonId: 999, // 担当外の営業担当者
        },
      });

      // 部下ではない
      mockPrismaService.salesperson.findFirst.mockResolvedValue(null);

      await expect(
        commentsService.createForProblem(1, { content: "コメント" }, mockManagerUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it("存在しないProblemへのコメントで404エラー", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(null);

      await expect(
        commentsService.createForProblem(999, { content: "コメント" }, mockManagerUser)
      ).rejects.toThrow(NotFoundException);
    });

    // CMT-005: 複数コメント投稿
    it("CMT-005: 同一Problemに複数コメントを投稿できる", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        dailyReport: {
          salespersonId: 1,
        },
      });

      mockPrismaService.salesperson.findFirst.mockResolvedValue({
        id: 1,
        managerId: 10,
      });

      // 3つのコメントを投稿
      for (let i = 1; i <= 3; i++) {
        const mockComment = {
          id: i,
          content: `コメント${i}`,
          createdAt: new Date(),
          commenter: { id: 10, name: "鈴木 部長" },
        };
        mockPrismaService.comment.create.mockResolvedValueOnce(mockComment);

        const result = await commentsService.createForProblem(
          1,
          { content: `コメント${i}` },
          mockManagerUser
        );

        expect(result.success).toBe(true);
      }

      expect(mockPrismaService.comment.create).toHaveBeenCalledTimes(3);
    });

    it("adminは全ての日報にコメントできる", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        dailyReport: {
          salespersonId: 1,
        },
      });

      const mockCreatedComment = {
        id: 1,
        content: "管理者からのコメント",
        createdAt: new Date("2026-02-15T10:30:00Z"),
        commenter: {
          id: 99,
          name: "Admin",
        },
      };

      mockPrismaService.comment.create.mockResolvedValue(mockCreatedComment);

      const result = await commentsService.createForProblem(
        1,
        { content: "管理者からのコメント" },
        mockAdminUser
      );

      expect(result.success).toBe(true);
    });
  });

  describe("findByPlan", () => {
    // CMT-011: Planコメント取得
    it("CMT-011: Planのコメント一覧を取得できる", async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({
        dailyReport: {
          salespersonId: 1,
        },
      });

      const mockComments = [
        {
          id: 2,
          content: "この計画について確認させてください",
          createdAt: new Date("2026-02-15T11:00:00Z"),
          commenter: {
            id: 10,
            name: "鈴木 部長",
          },
        },
      ];

      mockPrismaService.comment.findMany.mockResolvedValue(mockComments);

      const result = await commentsService.findByPlan(1, mockSalesUser);

      expect(result).toEqual({
        success: true,
        data: [
          {
            comment_id: 2,
            commenter: {
              salesperson_id: 10,
              name: "鈴木 部長",
            },
            content: "この計画について確認させてください",
            created_at: "2026-02-15T11:00:00.000Z",
          },
        ],
      });
    });

    it("存在しないPlanで404エラー", async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue(null);

      await expect(commentsService.findByPlan(999, mockSalesUser)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("createForPlan", () => {
    // CMT-002: Planへのコメント（上長）
    it("CMT-002: マネージャーは部下の日報のPlanにコメントできる", async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({
        dailyReport: {
          salespersonId: 1,
        },
      });

      mockPrismaService.salesperson.findFirst.mockResolvedValue({
        id: 1,
        managerId: 10,
      });

      const mockCreatedComment = {
        id: 2,
        content: "計画について確認させてください",
        createdAt: new Date("2026-02-15T11:00:00Z"),
        commenter: {
          id: 10,
          name: "鈴木 部長",
        },
      };

      mockPrismaService.comment.create.mockResolvedValue(mockCreatedComment);

      const result = await commentsService.createForPlan(
        1,
        { content: "計画について確認させてください" },
        mockManagerUser
      );

      expect(result.success).toBe(true);
      expect(result.data.comment_id).toBe(2);
    });

    it("営業担当者はPlanにコメントできない", async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({
        dailyReport: {
          salespersonId: 1,
        },
      });

      await expect(
        commentsService.createForPlan(1, { content: "コメント" }, mockSalesUser)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("remove", () => {
    // CMT-020: 自分のコメント削除
    it("CMT-020: マネージャーは自分のコメントを削除できる", async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        id: 1,
        commenterId: 10, // マネージャーのID
      });

      mockPrismaService.comment.delete.mockResolvedValue({ id: 1 });

      const result = await commentsService.remove(1, mockManagerUser);

      expect(result).toEqual({
        success: true,
        data: {
          message: "コメントを削除しました",
        },
      });
    });

    // CMT-021: 他人のコメント削除（403エラー）
    it("CMT-021: マネージャーは他人のコメントを削除できない", async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        id: 1,
        commenterId: 99, // 別のユーザーのID
      });

      await expect(commentsService.remove(1, mockManagerUser)).rejects.toThrow(ForbiddenException);
    });

    it("営業担当者はコメントを削除できない", async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        id: 1,
        commenterId: 1,
      });

      await expect(commentsService.remove(1, mockSalesUser)).rejects.toThrow(ForbiddenException);
    });

    it("adminは全てのコメントを削除できる", async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        id: 1,
        commenterId: 10, // 他人のコメント
      });

      mockPrismaService.comment.delete.mockResolvedValue({ id: 1 });

      const result = await commentsService.remove(1, mockAdminUser);

      expect(result.success).toBe(true);
    });

    it("存在しないコメントの削除で404エラー", async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(commentsService.remove(999, mockManagerUser)).rejects.toThrow(NotFoundException);
    });
  });
});
