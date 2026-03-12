import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlansService } from "./plans.service";
import type { PrismaService } from "../prisma";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

describe("PlansService", () => {
  let plansService: PlansService;

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
    plan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    plansService = new PlansService(mockPrismaService as unknown as PrismaService);
  });

  describe("findAll", () => {
    it("日報のPlan一覧を取得できる", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "draft",
      });

      const mockPlans = [
        {
          id: 1,
          content: "A社に見積書を提出する",
          createdAt: new Date("2026-02-15T09:00:00Z"),
          updatedAt: new Date("2026-02-15T09:00:00Z"),
          _count: { comments: 2 },
        },
      ];

      mockPrismaService.plan.findMany.mockResolvedValue(mockPlans);

      const result = await plansService.findAll(1, mockSalesUser);

      expect(result).toEqual({
        success: true,
        data: [
          {
            plan_id: 1,
            content: "A社に見積書を提出する",
            comment_count: 2,
            created_at: "2026-02-15T09:00:00.000Z",
            updated_at: "2026-02-15T09:00:00.000Z",
          },
        ],
      });
    });

    it("存在しない日報IDで404エラー", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue(null);

      await expect(plansService.findAll(999, mockSalesUser)).rejects.toThrow(NotFoundException);
    });

    it("他人の日報へのアクセスで403エラー", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 999,
        status: "draft",
      });

      await expect(plansService.findAll(1, mockSalesUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe("create", () => {
    // PLN-001: 正常系 - Planを登録できること
    it("PLN-001: Planを登録できる", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "draft",
      });

      const mockCreatedPlan = {
        id: 1,
        content: "A社に見積書を提出する",
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T09:00:00Z"),
        _count: { comments: 0 },
      };

      mockPrismaService.plan.create.mockResolvedValue(mockCreatedPlan);

      const result = await plansService.create(
        1,
        {
          content: "A社に見積書を提出する",
        },
        mockSalesUser
      );

      expect(result.success).toBe(true);
      expect(result.data.plan_id).toBe(1);
      expect(result.data.content).toBe("A社に見積書を提出する");
    });

    // PLN-002: 異常系 - 提出済み日報への追加で403エラー
    it("PLN-002: 提出済み日報への追加で403エラー", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "submitted",
      });

      await expect(
        plansService.create(
          1,
          {
            content: "計画内容",
          },
          mockSalesUser
        )
      ).rejects.toThrow(ForbiddenException);
    });

    // PLN-003: 異常系 - 他人の日報への追加で403エラー
    it("PLN-003: 他人の日報への追加で403エラー", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 999,
        status: "draft",
      });

      await expect(
        plansService.create(
          1,
          {
            content: "計画内容",
          },
          mockSalesUser
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("update", () => {
    // PLN-010: 正常系 - Planを更新できること
    it("PLN-010: Planを更新できる", async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 1,
          status: "draft",
        },
      });

      const mockUpdatedPlan = {
        id: 1,
        content: "更新された計画内容",
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T15:00:00Z"),
        _count: { comments: 1 },
      };

      mockPrismaService.plan.update.mockResolvedValue(mockUpdatedPlan);

      const result = await plansService.update(
        1,
        {
          content: "更新された計画内容",
        },
        mockSalesUser
      );

      expect(result.success).toBe(true);
      expect(result.data.content).toBe("更新された計画内容");
    });

    // PLN-011: 異常系 - 提出済み日報のPlan更新で403エラー
    it("PLN-011: 提出済み日報のPlan更新で403エラー", async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 1,
          status: "submitted",
        },
      });

      await expect(
        plansService.update(
          1,
          {
            content: "更新内容",
          },
          mockSalesUser
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it("他人のPlan更新で403エラー", async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 999,
          status: "draft",
        },
      });

      await expect(
        plansService.update(
          1,
          {
            content: "更新内容",
          },
          mockSalesUser
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it("存在しないPlanの更新で404エラー", async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue(null);

      await expect(
        plansService.update(
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
    // PLN-012: 正常系 - Planを削除できること
    it("PLN-012: Planを削除できる", async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 1,
          status: "draft",
        },
      });

      mockPrismaService.plan.delete.mockResolvedValue({ id: 1 });

      const result = await plansService.remove(1, mockSalesUser);

      expect(result).toEqual({
        success: true,
        message: "計画を削除しました",
      });
    });

    it("提出済み日報のPlan削除で403エラー", async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 1,
          status: "submitted",
        },
      });

      await expect(plansService.remove(1, mockSalesUser)).rejects.toThrow(ForbiddenException);
    });

    it("他人のPlan削除で403エラー", async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 999,
          status: "draft",
        },
      });

      await expect(plansService.remove(1, mockSalesUser)).rejects.toThrow(ForbiddenException);
    });

    it("存在しないPlanの削除で404エラー", async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue(null);

      await expect(plansService.remove(999, mockSalesUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe("admin access", () => {
    it("adminは他人の日報のPlan一覧を取得できる", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1, // 他人のID
        status: "draft",
      });

      mockPrismaService.plan.findMany.mockResolvedValue([]);

      const result = await plansService.findAll(1, mockAdminUser);

      expect(result.success).toBe(true);
    });

    it("adminは他人の日報にPlanを追加できる", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "draft",
      });

      const mockCreatedPlan = {
        id: 1,
        content: "計画内容",
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T09:00:00Z"),
        _count: { comments: 0 },
      };

      mockPrismaService.plan.create.mockResolvedValue(mockCreatedPlan);

      const result = await plansService.create(
        1,
        {
          content: "計画内容",
        },
        mockAdminUser
      );

      expect(result.success).toBe(true);
    });
  });
});
