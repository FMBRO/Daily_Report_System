import { beforeEach, describe, expect, it, vi } from "vitest";
import { VisitsController } from "./visits.controller";
import type { VisitsService } from "./visits.service";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

describe("VisitsController", () => {
  let visitsController: VisitsController;

  const mockSalesUser: AuthenticatedUser = {
    id: 1,
    email: "tanaka@example.com",
    name: "田中 太郎",
    role: "sales" as const,
  };

  const mockVisitsService = {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    visitsController = new VisitsController(mockVisitsService as unknown as VisitsService);
  });

  describe("findAll", () => {
    it("訪問記録一覧を取得できる", async () => {
      const mockResponse = {
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
      };

      mockVisitsService.findAll.mockResolvedValue(mockResponse);

      const result = await visitsController.findAll(1, { user: mockSalesUser });

      expect(result).toEqual(mockResponse);
      expect(mockVisitsService.findAll).toHaveBeenCalledWith(1, mockSalesUser);
    });
  });

  describe("create", () => {
    it("VST-001: 訪問記録を登録できる", async () => {
      const mockResponse = {
        success: true,
        data: {
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
      };

      mockVisitsService.create.mockResolvedValue(mockResponse);

      const dto = {
        customer_id: 1,
        visit_time: "10:00",
        visit_purpose: "定期訪問",
        visit_content: "新製品の提案を行った。",
        result: "次回見積提出予定",
      };

      const result = await visitsController.create(1, dto, { user: mockSalesUser });

      expect(result).toEqual(mockResponse);
      expect(mockVisitsService.create).toHaveBeenCalledWith(1, dto, mockSalesUser);
    });
  });

  describe("update", () => {
    it("VST-010: 訪問記録を更新できる", async () => {
      const mockResponse = {
        success: true,
        data: {
          visit_id: 1,
          customer: {
            customer_id: 2,
            customer_name: "株式会社XYZ",
          },
          visit_time: "14:00",
          visit_purpose: "緊急訪問",
          visit_content: "クレーム対応を行った。",
          result: "解決済み",
          created_at: "2026-02-15T09:00:00.000Z",
          updated_at: "2026-02-15T15:00:00.000Z",
        },
      };

      mockVisitsService.update.mockResolvedValue(mockResponse);

      const dto = {
        customer_id: 2,
        visit_time: "14:00",
        visit_purpose: "緊急訪問",
        visit_content: "クレーム対応を行った。",
        result: "解決済み",
      };

      const result = await visitsController.update(1, dto, { user: mockSalesUser });

      expect(result).toEqual(mockResponse);
      expect(mockVisitsService.update).toHaveBeenCalledWith(1, dto, mockSalesUser);
    });
  });

  describe("remove", () => {
    it("VST-013: 訪問記録を削除できる", async () => {
      const mockResponse = {
        success: true,
        message: "訪問記録を削除しました",
      };

      mockVisitsService.remove.mockResolvedValue(mockResponse);

      const result = await visitsController.remove(1, { user: mockSalesUser });

      expect(result).toEqual(mockResponse);
      expect(mockVisitsService.remove).toHaveBeenCalledWith(1, mockSalesUser);
    });
  });
});
