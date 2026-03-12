import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProblemsService } from "./problems.service";
import type { PrismaService } from "../prisma";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import type { Priority } from "@prisma/client";
import { PriorityEnum } from "./dto";

describe("ProblemsService", () => {
  let problemsService: ProblemsService;

  const mockSalesUser: AuthenticatedUser = {
    id: 1,
    email: "tanaka@example.com",
    name: "田中 太郎",
    role: "sales" as const,
  };

  const mockAdminUser: AuthenticatedUser = {
    id: 99,
    email: "admin@example.com",
    name: "Admin",
    role: "admin" as const,
  };

  const mockPrismaService = {
    dailyReport: {
      findUnique: vi.fn(),
    },
    problem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    problemsService = new ProblemsService(mockPrismaService as unknown as PrismaService);
  });

  describe("findAll", () => {
    it("日報のProblem一覧を取得できる", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "draft",
      });

      const mockProblems = [
        {
          id: 1,
          content: "競合他社が価格攻勢をかけてきている",
          priority: "high" as Priority,
          createdAt: new Date("2026-02-15T09:00:00Z"),
          updatedAt: new Date("2026-02-15T09:00:00Z"),
          _count: { comments: 2 },
        },
      ];

      mockPrismaService.problem.findMany.mockResolvedValue(mockProblems);

      const result = await problemsService.findAll(1, mockSalesUser);

      expect(result).toEqual({
        success: true,
        data: [
          {
            problem_id: 1,
            content: "競合他社が価格攻勢をかけてきている",
            priority: "high",
            comment_count: 2,
            created_at: "2026-02-15T09:00:00.000Z",
            updated_at: "2026-02-15T09:00:00.000Z",
          },
        ],
      });
    });

    it("存在しない日報IDで404エラー", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue(null);

      await expect(problemsService.findAll(999, mockSalesUser)).rejects.toThrow(NotFoundException);
    });

    it("他人の日報へのアクセスで403エラー", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 999,
        status: "draft",
      });

      await expect(problemsService.findAll(1, mockSalesUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe("create", () => {
    // PRB-001: 正常系 - Problemを登録できること
    it("PRB-001: Problemを登録できる", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "draft",
      });

      const mockCreatedProblem = {
        id: 1,
        content: "競合他社が価格攻勢をかけてきている",
        priority: "high" as Priority,
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T09:00:00Z"),
        _count: { comments: 0 },
      };

      mockPrismaService.problem.create.mockResolvedValue(mockCreatedProblem);

      const result = await problemsService.create(
        1,
        {
          content: "競合他社が価格攻勢をかけてきている",
          priority: PriorityEnum.HIGH,
        },
        mockSalesUser
      );

      expect(result.success).toBe(true);
      expect(result.data.problem_id).toBe(1);
      expect(result.data.priority).toBe("high");
    });

    // PRB-002: 異常系 - 内容未指定で422エラー（バリデーションはDTOで行うため省略）

    // PRB-003: 異常系 - 優先度未指定で422エラー（バリデーションはDTOで行うため省略）

    // PRB-004: 異常系 - 提出済み日報への追加で403エラー
    it("PRB-004: 提出済み日報への追加で403エラー", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "submitted",
      });

      await expect(
        problemsService.create(
          1,
          {
            content: "課題内容",
            priority: PriorityEnum.HIGH,
          },
          mockSalesUser
        )
      ).rejects.toThrow(ForbiddenException);
    });

    // PRB-005: 異常系 - 他人の日報への追加で403エラー
    it("PRB-005: 他人の日報への追加で403エラー", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 999,
        status: "draft",
      });

      await expect(
        problemsService.create(
          1,
          {
            content: "課題内容",
            priority: PriorityEnum.MEDIUM,
          },
          mockSalesUser
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("update", () => {
    // PRB-010: 正常系 - Problemを更新できること
    it("PRB-010: Problemを更新できる", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 1,
          status: "draft",
        },
      });

      const mockUpdatedProblem = {
        id: 1,
        content: "更新された課題内容",
        priority: "low" as Priority,
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T15:00:00Z"),
        _count: { comments: 1 },
      };

      mockPrismaService.problem.update.mockResolvedValue(mockUpdatedProblem);

      const result = await problemsService.update(
        1,
        {
          content: "更新された課題内容",
          priority: PriorityEnum.LOW,
        },
        mockSalesUser
      );

      expect(result.success).toBe(true);
      expect(result.data.content).toBe("更新された課題内容");
      expect(result.data.priority).toBe("low");
    });

    // PRB-011: 異常系 - 提出済み日報のProblem更新で403エラー
    it("PRB-011: 提出済み日報のProblem更新で403エラー", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 1,
          status: "submitted",
        },
      });

      await expect(
        problemsService.update(
          1,
          {
            content: "更新内容",
          },
          mockSalesUser
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it("他人のProblem更新で403エラー", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 999,
          status: "draft",
        },
      });

      await expect(
        problemsService.update(
          1,
          {
            content: "更新内容",
          },
          mockSalesUser
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it("存在しないProblemの更新で404エラー", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(null);

      await expect(
        problemsService.update(
          999,
          {
            content: "更新内容",
          },
          mockSalesUser
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    // PRB-012: 正常系 - Problemを削除できること
    it("PRB-012: Problemを削除できる", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 1,
          status: "draft",
        },
      });

      mockPrismaService.problem.delete.mockResolvedValue({ id: 1 });

      const result = await problemsService.remove(1, mockSalesUser);

      expect(result).toEqual({
        success: true,
        message: "課題・相談を削除しました",
      });
    });

    it("提出済み日報のProblem削除で403エラー", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 1,
          status: "submitted",
        },
      });

      await expect(problemsService.remove(1, mockSalesUser)).rejects.toThrow(ForbiddenException);
    });

    it("他人のProblem削除で403エラー", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 999,
          status: "draft",
        },
      });

      await expect(problemsService.remove(1, mockSalesUser)).rejects.toThrow(ForbiddenException);
    });

    it("存在しないProblemの削除で404エラー", async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(null);

      await expect(problemsService.remove(999, mockSalesUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe("admin access", () => {
    it("adminは他人の日報のProblem一覧を取得できる", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1, // 他人のID
        status: "draft",
      });

      mockPrismaService.problem.findMany.mockResolvedValue([]);

      const result = await problemsService.findAll(1, mockAdminUser);

      expect(result.success).toBe(true);
    });

    it("adminは他人の日報にProblemを追加できる", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "draft",
      });

      const mockCreatedProblem = {
        id: 1,
        content: "課題内容",
        priority: "medium" as Priority,
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T09:00:00Z"),
        _count: { comments: 0 },
      };

      mockPrismaService.problem.create.mockResolvedValue(mockCreatedProblem);

      const result = await problemsService.create(
        1,
        {
          content: "課題内容",
          priority: PriorityEnum.MEDIUM,
        },
        mockAdminUser
      );

      expect(result.success).toBe(true);
    });
  });
});
