import { UnprocessableEntityException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsService } from "./reports.service";
import type { PrismaService } from "../prisma";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

describe("ReportsService", () => {
  let reportsService: ReportsService;

  const mockUser: AuthenticatedUser = {
    id: 1,
    email: "tanaka@example.com",
    name: "田中 太郎",
    role: "sales" as const,
  };

  const mockPrismaService = {
    dailyReport: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
    },
    visit: {
      createMany: vi.fn(),
    },
    problem: {
      createMany: vi.fn(),
    },
    plan: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // 直接インスタンスを作成
    reportsService = new ReportsService(mockPrismaService as unknown as PrismaService);
  });

  describe("create", () => {
    const baseDto = {
      report_date: new Date("2026-02-15T00:00:00Z"),
    };

    // RPT-010: 正常系 - 日報を作成できること（最小項目）
    it("RPT-010: 訪問記録なしで日報を作成できること", async () => {
      const mockCreatedReport = {
        id: 1,
        salespersonId: 1,
        reportDate: new Date("2026-02-15T00:00:00Z"),
        status: "draft" as const,
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T09:00:00Z"),
      };

      // 同一日付の日報が存在しない
      mockPrismaService.dailyReport.findUnique.mockResolvedValue(null);

      // トランザクションをモック
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          dailyReport: {
            create: vi.fn().mockResolvedValue(mockCreatedReport),
          },
        });
      });

      const result = await reportsService.create(baseDto, mockUser);

      expect(result).toEqual({
        success: true,
        data: {
          report_id: 1,
          salesperson_id: 1,
          report_date: "2026-02-15",
          status: "draft",
          created_at: "2026-02-15T09:00:00.000Z",
          updated_at: "2026-02-15T09:00:00.000Z",
        },
      });

      expect(mockPrismaService.dailyReport.findUnique).toHaveBeenCalledWith({
        where: {
          salespersonId_reportDate: {
            salespersonId: 1,
            reportDate: new Date("2026-02-15T00:00:00Z"),
          },
        },
      });
    });

    // RPT-011: 正常系 - 訪問・Problem・Plan含めて日報を作成できること
    it("RPT-011: 訪問・Problem・Plan含めて日報を作成できること", async () => {
      const dto = {
        report_date: new Date("2026-02-15T00:00:00Z"),
        visits: [
          {
            customer_id: 1,
            visit_time: "10:00",
            visit_purpose: "定期訪問",
            visit_content: "新製品の提案を行った。",
            result: "次回見積提出予定",
          },
        ],
        problems: [
          {
            content: "競合他社が価格攻勢をかけてきている",
            priority: "high" as const,
          },
        ],
        plans: [
          {
            content: "A社に見積書を提出する",
          },
        ],
      };

      const mockCreatedReport = {
        id: 1,
        salespersonId: 1,
        reportDate: new Date("2026-02-15T00:00:00Z"),
        status: "draft" as const,
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T09:00:00Z"),
      };

      const mockExistingCustomers = [{ id: 1 }];

      // 同一日付の日報が存在しない
      mockPrismaService.dailyReport.findUnique.mockResolvedValue(null);
      // 顧客IDが存在する
      mockPrismaService.customer.findMany.mockResolvedValue(mockExistingCustomers);

      // トランザクションをモック
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          dailyReport: {
            create: vi.fn().mockResolvedValue(mockCreatedReport),
          },
          visit: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          problem: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          plan: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(mockTx);
      });

      const result = await reportsService.create(dto, mockUser);

      expect(result).toEqual({
        success: true,
        data: {
          report_id: 1,
          salesperson_id: 1,
          report_date: "2026-02-15",
          status: "draft",
          created_at: "2026-02-15T09:00:00.000Z",
          updated_at: "2026-02-15T09:00:00.000Z",
        },
      });

      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [1] },
          isActive: true,
        },
        select: { id: true },
      });
    });

    // RPT-012: 異常系 - 同一日付の日報が存在する場合は422エラー
    it("RPT-012: 同一日付の日報が存在する場合は422エラー", async () => {
      const existingReport = {
        id: 1,
        salespersonId: 1,
        reportDate: new Date("2026-02-15T00:00:00Z"),
        status: "draft" as const,
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T09:00:00Z"),
      };

      // 同一日付の日報が既に存在
      mockPrismaService.dailyReport.findUnique.mockResolvedValue(existingReport);

      await expect(reportsService.create(baseDto, mockUser)).rejects.toThrow(
        UnprocessableEntityException
      );

      // トランザクションは呼ばれない
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    // RPT-013: 異常系 - 存在しない顧客IDを含む場合は422エラー
    it("RPT-013: 存在しない顧客IDを含む場合は422エラー", async () => {
      const dto = {
        report_date: new Date("2026-02-15T00:00:00Z"),
        visits: [
          {
            customer_id: 999, // 存在しない顧客ID
            visit_content: "訪問内容",
          },
        ],
      };

      // 同一日付の日報が存在しない
      mockPrismaService.dailyReport.findUnique.mockResolvedValue(null);
      // 顧客IDが存在しない（空配列）
      mockPrismaService.customer.findMany.mockResolvedValue([]);

      await expect(reportsService.create(dto, mockUser)).rejects.toThrow(
        UnprocessableEntityException
      );

      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [999] },
          isActive: true,
        },
        select: { id: true },
      });

      // トランザクションは呼ばれない
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    // RPT-014: 正常系 - 初期ステータスはdraftであること
    it("RPT-014: 初期ステータスはdraftであること", async () => {
      const mockCreatedReport = {
        id: 1,
        salespersonId: 1,
        reportDate: new Date("2026-02-15T00:00:00Z"),
        status: "draft" as const,
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T09:00:00Z"),
      };

      // 同一日付の日報が存在しない
      mockPrismaService.dailyReport.findUnique.mockResolvedValue(null);

      // トランザクションをモック
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockCreate = vi.fn().mockResolvedValue(mockCreatedReport);
        const result = await callback({
          dailyReport: {
            create: mockCreate,
          },
        });

        // statusがdraftで作成されることを確認
        expect(mockCreate).toHaveBeenCalledWith({
          data: {
            salespersonId: 1,
            reportDate: new Date("2026-02-15T00:00:00Z"),
            status: "draft",
          },
        });

        return result;
      });

      const result = await reportsService.create(baseDto, mockUser);

      expect(result.data.status).toBe("draft");
    });
  });
});
