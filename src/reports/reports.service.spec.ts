import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsService } from "./reports.service";
import type { PrismaService } from "../prisma";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

describe("ReportsService", () => {
  let reportsService: ReportsService;

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
    dailyReport: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    salesperson: {
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    reportsService = new ReportsService(mockPrismaService as unknown as PrismaService);
  });

  describe("findAll", () => {
    // RPT-001: 正常系 - 日報一覧を取得できること
    it("RPT-001: 日報一覧を正しく取得できる", async () => {
      const mockReports = [
        {
          id: 1,
          reportDate: new Date("2026-02-15T00:00:00Z"),
          status: "submitted" as const,
          createdAt: new Date("2026-02-15T09:00:00Z"),
          updatedAt: new Date("2026-02-15T18:00:00Z"),
          salesperson: {
            id: 1,
            name: "田中 太郎",
          },
          _count: {
            visits: 3,
            problems: 1,
            plans: 2,
          },
        },
        {
          id: 2,
          reportDate: new Date("2026-02-14T00:00:00Z"),
          status: "draft" as const,
          createdAt: new Date("2026-02-14T10:00:00Z"),
          updatedAt: new Date("2026-02-14T17:00:00Z"),
          salesperson: {
            id: 1,
            name: "田中 太郎",
          },
          _count: {
            visits: 1,
            problems: 0,
            plans: 1,
          },
        },
      ];

      mockPrismaService.salesperson.findMany.mockResolvedValue([]);
      mockPrismaService.dailyReport.count.mockResolvedValue(2);
      mockPrismaService.dailyReport.findMany.mockResolvedValue(mockReports);

      const result = await reportsService.findAll({ page: 1, per_page: 20 }, mockSalesUser);

      expect(result).toEqual({
        success: true,
        data: [
          {
            report_id: 1,
            salesperson: {
              salesperson_id: 1,
              name: "田中 太郎",
            },
            report_date: "2026-02-15",
            status: "submitted",
            visit_count: 3,
            problem_count: 1,
            plan_count: 2,
            created_at: "2026-02-15T09:00:00.000Z",
            updated_at: "2026-02-15T18:00:00.000Z",
          },
          {
            report_id: 2,
            salesperson: {
              salesperson_id: 1,
              name: "田中 太郎",
            },
            report_date: "2026-02-14",
            status: "draft",
            visit_count: 1,
            problem_count: 0,
            plan_count: 1,
            created_at: "2026-02-14T10:00:00.000Z",
            updated_at: "2026-02-14T17:00:00.000Z",
          },
        ],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: 2,
        },
      });
    });

    // RPT-002: 正常系 - 日付範囲でフィルタリングできること
    it("RPT-002: 日付範囲でフィルタリングできる", async () => {
      const mockReports = [
        {
          id: 1,
          reportDate: new Date("2026-02-15T00:00:00Z"),
          status: "submitted" as const,
          createdAt: new Date("2026-02-15T09:00:00Z"),
          updatedAt: new Date("2026-02-15T18:00:00Z"),
          salesperson: {
            id: 1,
            name: "田中 太郎",
          },
          _count: {
            visits: 3,
            problems: 1,
            plans: 2,
          },
        },
      ];

      mockPrismaService.salesperson.findMany.mockResolvedValue([]);
      mockPrismaService.dailyReport.count.mockResolvedValue(1);
      mockPrismaService.dailyReport.findMany.mockResolvedValue(mockReports);

      const dateFrom = new Date("2026-02-15");
      const dateTo = new Date("2026-02-15");

      await reportsService.findAll(
        { date_from: dateFrom, date_to: dateTo, page: 1, per_page: 20 },
        mockSalesUser
      );

      expect(mockPrismaService.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reportDate: {
              gte: dateFrom,
              lte: dateTo,
            },
          }),
        })
      );
    });

    // RPT-003: 正常系 - ステータスでフィルタリングできること
    it("RPT-003: ステータスでフィルタリングできる", async () => {
      const mockReports = [
        {
          id: 1,
          reportDate: new Date("2026-02-15T00:00:00Z"),
          status: "submitted" as const,
          createdAt: new Date("2026-02-15T09:00:00Z"),
          updatedAt: new Date("2026-02-15T18:00:00Z"),
          salesperson: {
            id: 1,
            name: "田中 太郎",
          },
          _count: {
            visits: 3,
            problems: 1,
            plans: 2,
          },
        },
      ];

      mockPrismaService.salesperson.findMany.mockResolvedValue([]);
      mockPrismaService.dailyReport.count.mockResolvedValue(1);
      mockPrismaService.dailyReport.findMany.mockResolvedValue(mockReports);

      await reportsService.findAll({ status: "submitted", page: 1, per_page: 20 }, mockSalesUser);

      expect(mockPrismaService.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "submitted",
          }),
        })
      );
    });

    // RPT-004: 正常系 - ページネーションが機能すること
    it("RPT-004: ページネーションが正しく機能する", async () => {
      mockPrismaService.salesperson.findMany.mockResolvedValue([]);
      mockPrismaService.dailyReport.count.mockResolvedValue(50);
      mockPrismaService.dailyReport.findMany.mockResolvedValue([]);

      const result = await reportsService.findAll({ page: 2, per_page: 20 }, mockSalesUser);

      expect(result.pagination).toEqual({
        current_page: 2,
        per_page: 20,
        total_pages: 3,
        total_count: 50,
      });

      expect(mockPrismaService.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });

    // RPT-005: 正常系 - salesは自分の日報のみ取得、managerは部下も、adminは全て
    it("RPT-005-A: salesユーザーは自分の日報のみ取得できる", async () => {
      mockPrismaService.salesperson.findMany.mockResolvedValue([]);
      mockPrismaService.dailyReport.count.mockResolvedValue(0);
      mockPrismaService.dailyReport.findMany.mockResolvedValue([]);

      await reportsService.findAll({ page: 1, per_page: 20 }, mockSalesUser);

      expect(mockPrismaService.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            salespersonId: { in: [1] },
          }),
        })
      );
    });

    it("RPT-005-B: managerユーザーは自分と部下の日報を取得できる", async () => {
      // managerの部下を模擬
      mockPrismaService.salesperson.findMany.mockResolvedValue([
        { id: 1 }, // 直属の部下
        { id: 2 }, // 直属の部下
      ]);

      // 孫部下なし
      mockPrismaService.salesperson.findMany.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
      mockPrismaService.salesperson.findMany.mockResolvedValueOnce([]);
      mockPrismaService.salesperson.findMany.mockResolvedValueOnce([]);

      mockPrismaService.dailyReport.count.mockResolvedValue(0);
      mockPrismaService.dailyReport.findMany.mockResolvedValue([]);

      await reportsService.findAll({ page: 1, per_page: 20 }, mockManagerUser);

      expect(mockPrismaService.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            salespersonId: { in: [10, 1, 2] },
          }),
        })
      );
    });

    it("RPT-005-C: adminユーザーは全ての日報を取得できる", async () => {
      mockPrismaService.dailyReport.count.mockResolvedValue(0);
      mockPrismaService.dailyReport.findMany.mockResolvedValue([]);

      await reportsService.findAll({ page: 1, per_page: 20 }, mockAdminUser);

      // adminの場合、salespersonIdの制約がない
      expect(mockPrismaService.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            salespersonId: expect.anything(),
          }),
        })
      );
    });

    it("RPT-005-D: salesユーザーが他人の日報を指定すると403エラー", async () => {
      mockPrismaService.salesperson.findMany.mockResolvedValue([]);

      await expect(
        reportsService.findAll({ salesperson_id: 999, page: 1, per_page: 20 }, mockSalesUser)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("findOne", () => {
    // RPT-020: 正常系 - 日報詳細（訪問・Problem・Plan含む）を取得できること
    it("RPT-020: 日報詳細を正しく取得できる", async () => {
      const mockReport = {
        id: 1,
        reportDate: new Date("2026-02-15T00:00:00Z"),
        status: "submitted" as const,
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T18:00:00Z"),
        salespersonId: 1,
        salesperson: {
          id: 1,
          name: "田中 太郎",
          email: "tanaka@example.com",
        },
        visits: [
          {
            id: 1,
            visitTime: new Date("2026-02-15T10:00:00Z"),
            visitPurpose: "定期訪問",
            visitContent: "新製品の提案を行った。",
            result: "次回見積提出予定",
            customer: {
              id: 1,
              customerName: "株式会社ABC",
            },
          },
        ],
        problems: [
          {
            id: 1,
            content: "競合他社が価格攻勢をかけてきている",
            priority: "high" as const,
            comments: [
              {
                id: 1,
                content: "来週のミーティングで対策を検討しましょう",
                createdAt: new Date("2026-02-15T19:00:00Z"),
                commenter: {
                  id: 10,
                  name: "鈴木 部長",
                },
              },
            ],
          },
        ],
        plans: [
          {
            id: 1,
            content: "A社に見積書を提出する",
            comments: [
              {
                id: 2,
                content: "見積書の内容を事前に確認させてください",
                createdAt: new Date("2026-02-15T19:05:00Z"),
                commenter: {
                  id: 10,
                  name: "鈴木 部長",
                },
              },
            ],
          },
        ],
      };

      mockPrismaService.salesperson.findMany.mockResolvedValue([]);
      mockPrismaService.dailyReport.findUnique.mockResolvedValue(mockReport);

      const result = await reportsService.findOne(1, mockSalesUser);

      expect(result).toEqual({
        success: true,
        data: {
          report_id: 1,
          salesperson: {
            salesperson_id: 1,
            name: "田中 太郎",
            email: "tanaka@example.com",
          },
          report_date: "2026-02-15",
          status: "submitted",
          visits: [
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
            },
          ],
          problems: [
            {
              problem_id: 1,
              content: "競合他社が価格攻勢をかけてきている",
              priority: "high",
              comments: [
                {
                  comment_id: 1,
                  commenter: {
                    salesperson_id: 10,
                    name: "鈴木 部長",
                  },
                  content: "来週のミーティングで対策を検討しましょう",
                  created_at: "2026-02-15T19:00:00.000Z",
                },
              ],
            },
          ],
          plans: [
            {
              plan_id: 1,
              content: "A社に見積書を提出する",
              comments: [
                {
                  comment_id: 2,
                  commenter: {
                    salesperson_id: 10,
                    name: "鈴木 部長",
                  },
                  content: "見積書の内容を事前に確認させてください",
                  created_at: "2026-02-15T19:05:00.000Z",
                },
              ],
            },
          ],
          created_at: "2026-02-15T09:00:00.000Z",
          updated_at: "2026-02-15T18:00:00.000Z",
        },
      });
    });

    // RPT-021: 異常系 - 存在しない日報IDで404
    it("RPT-021: 存在しない日報IDで404エラーが返る", async () => {
      mockPrismaService.dailyReport.findUnique.mockResolvedValue(null);

      await expect(reportsService.findOne(999, mockSalesUser)).rejects.toThrow(NotFoundException);
    });

    // RPT-022: 異常系 - 他人の日報(salesロール)で403
    it("RPT-022: salesユーザーが他人の日報を取得すると403エラー", async () => {
      const mockReport = {
        id: 1,
        reportDate: new Date("2026-02-15T00:00:00Z"),
        status: "submitted" as const,
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T18:00:00Z"),
        salespersonId: 999, // 他人のID
        salesperson: {
          id: 999,
          name: "他の営業",
          email: "other@example.com",
        },
        visits: [],
        problems: [],
        plans: [],
      };

      mockPrismaService.salesperson.findMany.mockResolvedValue([]);
      mockPrismaService.dailyReport.findUnique.mockResolvedValue(mockReport);

      await expect(reportsService.findOne(1, mockSalesUser)).rejects.toThrow(ForbiddenException);
    });

    // RPT-023: 正常系 - コメントも含めて取得できること
    it("RPT-023: コメントを含めて日報詳細を取得できる", async () => {
      const mockReport = {
        id: 1,
        reportDate: new Date("2026-02-15T00:00:00Z"),
        status: "submitted" as const,
        createdAt: new Date("2026-02-15T09:00:00Z"),
        updatedAt: new Date("2026-02-15T18:00:00Z"),
        salespersonId: 1,
        salesperson: {
          id: 1,
          name: "田中 太郎",
          email: "tanaka@example.com",
        },
        visits: [],
        problems: [
          {
            id: 1,
            content: "課題内容",
            priority: "medium" as const,
            comments: [
              {
                id: 1,
                content: "コメント1",
                createdAt: new Date("2026-02-15T19:00:00Z"),
                commenter: { id: 10, name: "鈴木 部長" },
              },
              {
                id: 2,
                content: "コメント2",
                createdAt: new Date("2026-02-15T20:00:00Z"),
                commenter: { id: 10, name: "鈴木 部長" },
              },
            ],
          },
        ],
        plans: [
          {
            id: 1,
            content: "プラン内容",
            comments: [
              {
                id: 3,
                content: "プランコメント",
                createdAt: new Date("2026-02-15T21:00:00Z"),
                commenter: { id: 10, name: "鈴木 部長" },
              },
            ],
          },
        ],
      };

      mockPrismaService.salesperson.findMany.mockResolvedValue([]);
      mockPrismaService.dailyReport.findUnique.mockResolvedValue(mockReport);

      const result = await reportsService.findOne(1, mockSalesUser);

      expect(result.data.problems[0].comments).toHaveLength(2);
      expect(result.data.plans[0].comments).toHaveLength(1);
    });
  });
});
