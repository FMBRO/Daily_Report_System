import {
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VisitsService } from "./visits.service";
import type { PrismaService } from "../prisma";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

describe("VisitsService", () => {
  let visitsService: VisitsService;

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
    visit: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    visitsService = new VisitsService(mockPrismaService as unknown as PrismaService);
  });

  describe("findAll", () => {
    it("日報の訪問記録一覧を取得できる", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "draft",
      });

      const mockVisits = [
        {
          id: 1,
          visitTime: new Date("1970-01-01T10:00:00Z"),
          visitPurpose: "定期訪問",
          visitContent: "新製品の提案を行った。",
          result: "次回見積提出予定",
          createdAt: new Date("2026-02-15T09:00:00Z"),
          updatedAt: new Date("2026-02-15T09:00:00Z"),
          customer: {
            id: 1,
            customerName: "株式会社ABC",
          },
        },
      ];

      mockPrismaService.visit.findMany.mockResolvedValue(mockVisits);

      const result = await visitsService.findAll(1, mockSalesUser);

      expect(result).toEqual({
        success: true,
        data: [
          {
            visit_id: 1,
            customer: {
              customer_id: 1,
              customer_name: "株式会社ABC",
            },
            visit_time: "10:00",
            visit_purpose: "定期訪問",
            visit_content: "新製品の提案を行った。",
            result: "次回見積提出予定",
            created_at: "2026-02-15T09:00:00.000Z",
            updated_at: "2026-02-15T09:00:00.000Z",
          },
        ],
      });
    });

    it("存在しない日報IDで404エラー", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue(null);

      await expect(visitsService.findAll(999, mockSalesUser)).rejects.toThrow(NotFoundException);
    });

    it("他人の日報へのアクセスで403エラー", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 999,
        status: "draft",
      });

      await expect(visitsService.findAll(1, mockSalesUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe("create", () => {
    // VST-001: 正常系 - 訪問記録を登録できること
    it("VST-001: 訪問記録を登録できる", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "draft",
      });

      mockPrismaService.customer.findUnique.mockResolvedValue({ id: 1 });

      const mockCreatedVisit = {
        id: 1,
        visitTime: new Date("1970-01-01T10:00:00Z"),
        visitPurpose: "定期訪問",
        visitContent: "新製品の提案を行った。",
        result: "次回見積提出予定",
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T09:00:00Z"),
        customer: {
          id: 1,
          customerName: "株式会社ABC",
        },
      };

      mockPrismaService.visit.create.mockResolvedValue(mockCreatedVisit);

      const result = await visitsService.create(
        1,
        {
          customer_id: 1,
          visit_time: "10:00",
          visit_purpose: "定期訪問",
          visit_content: "新製品の提案を行った。",
          result: "次回見積提出予定",
        },
        mockSalesUser
      );

      expect(result.success).toBe(true);
      expect(result.data.visit_id).toBe(1);
      expect(result.data.visit_time).toBe("10:00");
    });

    // VST-002: 異常系 - 顧客ID未指定で422エラー（バリデーションはDTOで行うため省略）

    // VST-003: 異常系 - 訪問内容未指定で422エラー（バリデーションはDTOで行うため省略）

    // VST-004: 異常系 - 存在しない顧客IDで422エラー
    it("VST-004: 存在しない顧客IDで422エラー", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "draft",
      });

      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(
        visitsService.create(
          1,
          {
            customer_id: 999,
            visit_content: "訪問内容",
          },
          mockSalesUser
        )
      ).rejects.toThrow(UnprocessableEntityException);
    });

    // VST-005: 異常系 - 提出済み日報への追加で403エラー
    it("VST-005: 提出済み日報への追加で403エラー", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "submitted",
      });

      await expect(
        visitsService.create(
          1,
          {
            customer_id: 1,
            visit_content: "訪問内容",
          },
          mockSalesUser
        )
      ).rejects.toThrow(ForbiddenException);
    });

    // VST-006: 異常系 - 他人の日報への追加で403エラー
    it("VST-006: 他人の日報への追加で403エラー", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 999,
        status: "draft",
      });

      await expect(
        visitsService.create(
          1,
          {
            customer_id: 1,
            visit_content: "訪問内容",
          },
          mockSalesUser
        )
      ).rejects.toThrow(ForbiddenException);
    });

    // VST-007: 正常系 - 任意項目なしで登録できること
    it("VST-007: 任意項目なしで登録できる", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "draft",
      });

      mockPrismaService.customer.findUnique.mockResolvedValue({ id: 1 });

      const mockCreatedVisit = {
        id: 1,
        visitTime: null,
        visitPurpose: null,
        visitContent: "訪問内容",
        result: null,
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T09:00:00Z"),
        customer: {
          id: 1,
          customerName: "株式会社ABC",
        },
      };

      mockPrismaService.visit.create.mockResolvedValue(mockCreatedVisit);

      const result = await visitsService.create(
        1,
        {
          customer_id: 1,
          visit_content: "訪問内容",
        },
        mockSalesUser
      );

      expect(result.success).toBe(true);
      expect(result.data.visit_time).toBeNull();
      expect(result.data.visit_purpose).toBeNull();
      expect(result.data.result).toBeNull();
    });
  });

  describe("update", () => {
    // VST-010: 正常系 - 訪問記録を更新できること
    it("VST-010: 訪問記録を更新できる", async () => {
      mockPrismaService.visit.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 1,
          status: "draft",
        },
      });

      mockPrismaService.customer.findUnique.mockResolvedValue({ id: 2 });

      const mockUpdatedVisit = {
        id: 1,
        visitTime: new Date("1970-01-01T14:00:00Z"),
        visitPurpose: "緊急訪問",
        visitContent: "クレーム対応を行った。",
        result: "解決済み",
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T15:00:00Z"),
        customer: {
          id: 2,
          customerName: "株式会社XYZ",
        },
      };

      mockPrismaService.visit.update.mockResolvedValue(mockUpdatedVisit);

      const result = await visitsService.update(
        1,
        {
          customer_id: 2,
          visit_time: "14:00",
          visit_purpose: "緊急訪問",
          visit_content: "クレーム対応を行った。",
          result: "解決済み",
        },
        mockSalesUser
      );

      expect(result.success).toBe(true);
      expect(result.data.visit_time).toBe("14:00");
    });

    // VST-011: 異常系 - 提出済み日報の訪問記録更新で403エラー
    it("VST-011: 提出済み日報の訪問記録更新で403エラー", async () => {
      mockPrismaService.visit.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 1,
          status: "submitted",
        },
      });

      await expect(
        visitsService.update(
          1,
          {
            visit_content: "更新内容",
          },
          mockSalesUser
        )
      ).rejects.toThrow(ForbiddenException);
    });

    // VST-012: 異常系 - 他人の訪問記録更新で403エラー
    it("VST-012: 他人の訪問記録更新で403エラー", async () => {
      mockPrismaService.visit.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 999,
          status: "draft",
        },
      });

      await expect(
        visitsService.update(
          1,
          {
            visit_content: "更新内容",
          },
          mockSalesUser
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it("存在しない訪問記録の更新で404エラー", async () => {
      mockPrismaService.visit.findUnique.mockResolvedValue(null);

      await expect(
        visitsService.update(
          999,
          {
            visit_content: "更新内容",
          },
          mockSalesUser
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    // VST-013: 正常系 - 訪問記録を削除できること
    it("VST-013: 訪問記録を削除できる", async () => {
      mockPrismaService.visit.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 1,
          status: "draft",
        },
      });

      mockPrismaService.visit.delete.mockResolvedValue({ id: 1 });

      const result = await visitsService.remove(1, mockSalesUser);

      expect(result).toEqual({
        success: true,
        message: "訪問記録を削除しました",
      });
    });

    it("提出済み日報の訪問記録削除で403エラー", async () => {
      mockPrismaService.visit.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 1,
          status: "submitted",
        },
      });

      await expect(visitsService.remove(1, mockSalesUser)).rejects.toThrow(ForbiddenException);
    });

    it("他人の訪問記録削除で403エラー", async () => {
      mockPrismaService.visit.findUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salespersonId: 999,
          status: "draft",
        },
      });

      await expect(visitsService.remove(1, mockSalesUser)).rejects.toThrow(ForbiddenException);
    });

    it("存在しない訪問記録の削除で404エラー", async () => {
      mockPrismaService.visit.findUnique.mockResolvedValue(null);

      await expect(visitsService.remove(999, mockSalesUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe("admin access", () => {
    it("adminは他人の日報の訪問記録一覧を取得できる", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1, // 他人のID
        status: "draft",
      });

      mockPrismaService.visit.findMany.mockResolvedValue([]);

      const result = await visitsService.findAll(1, mockAdminUser);

      expect(result.success).toBe(true);
    });

    it("adminは他人の日報に訪問記録を追加できる", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue({
        salespersonId: 1,
        status: "draft",
      });

      mockPrismaService.customer.findUnique.mockResolvedValue({ id: 1 });

      const mockCreatedVisit = {
        id: 1,
        visitTime: null,
        visitPurpose: null,
        visitContent: "訪問内容",
        result: null,
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T09:00:00Z"),
        customer: {
          id: 1,
          customerName: "株式会社ABC",
        },
      };

      mockPrismaService.visit.create.mockResolvedValue(mockCreatedVisit);

      const result = await visitsService.create(
        1,
        {
          customer_id: 1,
          visit_content: "訪問内容",
        },
        mockAdminUser
      );

      expect(result.success).toBe(true);
    });
  });
});
