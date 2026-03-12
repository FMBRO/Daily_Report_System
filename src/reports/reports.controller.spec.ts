import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsController } from "./reports.controller";
import type { ReportsService } from "./reports.service";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

describe("ReportsController", () => {
  let reportsController: ReportsController;

  const mockSalesUser: AuthenticatedUser = {
    id: 1,
    email: "tanaka@example.com",
    name: "田中 太郎",
    role: "sales" as const,
  };

  const mockReportsService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    reportsController = new ReportsController(mockReportsService as unknown as ReportsService);
  });

  describe("findAll", () => {
    // RPT-001: 正常系 - 日報一覧を取得できること
    it("RPT-001: 日報一覧を正しく取得できる", async () => {
      const mockListResponse = {
        success: true,
        data: [
          {
            report_id: 1,
            salesperson: {
              salesperson_id: 1,
              name: "田中 太郎",
            },
            report_date: "2026-02-15",
            status: "submitted" as const,
            visit_count: 3,
            problem_count: 1,
            plan_count: 2,
            created_at: "2026-02-15T09:00:00.000Z",
            updated_at: "2026-02-15T18:00:00.000Z",
          },
        ],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: 1,
        },
      };

      mockReportsService.findAll.mockResolvedValue(mockListResponse);

      const result = await reportsController.findAll(
        { page: 1, per_page: 20 },
        { user: mockSalesUser }
      );

      expect(result).toEqual(mockListResponse);
      expect(mockReportsService.findAll).toHaveBeenCalledWith(
        { page: 1, per_page: 20 },
        mockSalesUser
      );
    });

    // RPT-002: 正常系 - 日付範囲でフィルタリングできること
    it("RPT-002: 日付範囲でフィルタリングできる", async () => {
      const mockListResponse = {
        success: true,
        data: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 0,
          total_count: 0,
        },
      };

      mockReportsService.findAll.mockResolvedValue(mockListResponse);

      const dateFrom = new Date("2026-02-15");
      const dateTo = new Date("2026-02-15");

      await reportsController.findAll(
        { date_from: dateFrom, date_to: dateTo, page: 1, per_page: 20 },
        { user: mockSalesUser }
      );

      expect(mockReportsService.findAll).toHaveBeenCalledWith(
        { date_from: dateFrom, date_to: dateTo, page: 1, per_page: 20 },
        mockSalesUser
      );
    });

    // RPT-003: 正常系 - ステータスでフィルタリングできること
    it("RPT-003: ステータスでフィルタリングできる", async () => {
      const mockListResponse = {
        success: true,
        data: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 0,
          total_count: 0,
        },
      };

      mockReportsService.findAll.mockResolvedValue(mockListResponse);

      await reportsController.findAll(
        { status: "submitted", page: 1, per_page: 20 },
        { user: mockSalesUser }
      );

      expect(mockReportsService.findAll).toHaveBeenCalledWith(
        { status: "submitted", page: 1, per_page: 20 },
        mockSalesUser
      );
    });

    // RPT-004: 正常系 - ページネーションが機能すること
    it("RPT-004: ページネーションが正しく機能する", async () => {
      const mockListResponse = {
        success: true,
        data: [],
        pagination: {
          current_page: 2,
          per_page: 20,
          total_pages: 3,
          total_count: 50,
        },
      };

      mockReportsService.findAll.mockResolvedValue(mockListResponse);

      const result = await reportsController.findAll(
        { page: 2, per_page: 20 },
        { user: mockSalesUser }
      );

      expect(result.pagination.current_page).toBe(2);
      expect(result.pagination.total_pages).toBe(3);
    });
  });

  describe("findOne", () => {
    // RPT-020: 正常系 - 日報詳細（訪問・Problem・Plan含む）を取得できること
    it("RPT-020: 日報詳細を正しく取得できる", async () => {
      const mockDetailResponse = {
        success: true,
        data: {
          report_id: 1,
          salesperson: {
            salesperson_id: 1,
            name: "田中 太郎",
            email: "tanaka@example.com",
          },
          report_date: "2026-02-15",
          status: "submitted" as const,
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
              priority: "high" as const,
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
      };

      mockReportsService.findOne.mockResolvedValue(mockDetailResponse);

      const result = await reportsController.findOne(1, { user: mockSalesUser });

      expect(result).toEqual(mockDetailResponse);
      expect(mockReportsService.findOne).toHaveBeenCalledWith(1, mockSalesUser);
    });

    // RPT-023: 正常系 - コメントも含めて取得できること
    it("RPT-023: コメントを含めて日報詳細を取得できる", async () => {
      const mockDetailResponse = {
        success: true,
        data: {
          report_id: 1,
          salesperson: {
            salesperson_id: 1,
            name: "田中 太郎",
            email: "tanaka@example.com",
          },
          report_date: "2026-02-15",
          status: "submitted" as const,
          visits: [],
          problems: [
            {
              problem_id: 1,
              content: "課題内容",
              priority: "medium" as const,
              comments: [
                {
                  comment_id: 1,
                  commenter: { salesperson_id: 10, name: "鈴木 部長" },
                  content: "コメント1",
                  created_at: "2026-02-15T19:00:00.000Z",
                },
                {
                  comment_id: 2,
                  commenter: { salesperson_id: 10, name: "鈴木 部長" },
                  content: "コメント2",
                  created_at: "2026-02-15T20:00:00.000Z",
                },
              ],
            },
          ],
          plans: [
            {
              plan_id: 1,
              content: "プラン内容",
              comments: [
                {
                  comment_id: 3,
                  commenter: { salesperson_id: 10, name: "鈴木 部長" },
                  content: "プランコメント",
                  created_at: "2026-02-15T21:00:00.000Z",
                },
              ],
            },
          ],
          created_at: "2026-02-15T09:00:00.000Z",
          updated_at: "2026-02-15T18:00:00.000Z",
        },
      };

      mockReportsService.findOne.mockResolvedValue(mockDetailResponse);

      const result = await reportsController.findOne(1, { user: mockSalesUser });

      expect(result.data.problems[0].comments).toHaveLength(2);
      expect(result.data.plans[0].comments).toHaveLength(1);
    });
  });
});
