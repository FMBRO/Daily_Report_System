import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsController } from "./reports.controller";
import type { ReportsService } from "./reports.service";
import type { CreateReportDto, CreateReportResponseDto } from "./dto";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

describe("ReportsController", () => {
  let controller: ReportsController;
  let mockReportsService: {
    create: ReturnType<typeof vi.fn>;
  };

  const mockUser: AuthenticatedUser = {
    id: 1,
    email: "tanaka@example.com",
    name: "田中 太郎",
    role: "sales" as const,
  };

  const mockCreateResponse: CreateReportResponseDto = {
    success: true,
    data: {
      report_id: 1,
      salesperson_id: 1,
      report_date: "2026-02-15",
      status: "draft",
      created_at: "2026-02-15T09:00:00.000Z",
      updated_at: "2026-02-15T09:00:00.000Z",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockReportsService = {
      create: vi.fn(),
    };

    controller = new ReportsController(mockReportsService as unknown as ReportsService);
  });

  describe("create", () => {
    // RPT-010: 正常系 - 日報を作成できること（最小項目）
    it("RPT-010: 訪問記録なしで日報を作成できること", async () => {
      const dto: CreateReportDto = {
        report_date: new Date("2026-02-15T00:00:00Z"),
      };

      mockReportsService.create.mockResolvedValue(mockCreateResponse);

      const result = await controller.create(dto, { user: mockUser });

      expect(result).toEqual(mockCreateResponse);
      expect(mockReportsService.create).toHaveBeenCalledWith(dto, mockUser);
    });

    // RPT-011: 正常系 - 訪問・Problem・Plan含めて日報を作成できること
    it("RPT-011: 訪問・Problem・Plan含めて日報を作成できること", async () => {
      const dto: CreateReportDto = {
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
            priority: "high",
          },
        ],
        plans: [
          {
            content: "A社に見積書を提出する",
          },
        ],
      };

      mockReportsService.create.mockResolvedValue(mockCreateResponse);

      const result = await controller.create(dto, { user: mockUser });

      expect(result).toEqual(mockCreateResponse);
      expect(mockReportsService.create).toHaveBeenCalledWith(dto, mockUser);
    });

    // RPT-014: 正常系 - 初期ステータスはdraftであること
    it("RPT-014: 初期ステータスはdraftであること", async () => {
      const dto: CreateReportDto = {
        report_date: new Date("2026-02-15T00:00:00Z"),
      };

      mockReportsService.create.mockResolvedValue(mockCreateResponse);

      const result = await controller.create(dto, { user: mockUser });

      expect(result.data.status).toBe("draft");
      expect(mockReportsService.create).toHaveBeenCalledWith(dto, mockUser);
    });
  });
});
