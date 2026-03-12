import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlansController } from "./plans.controller";
import type { PlansService } from "./plans.service";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

describe("PlansController", () => {
  let plansController: PlansController;

  const mockSalesUser: AuthenticatedUser = {
    id: 1,
    email: "tanaka@example.com",
    name: "田中 太郎",
    role: "sales" as const,
  };

  const mockPlansService = {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    plansController = new PlansController(mockPlansService as unknown as PlansService);
  });

  describe("findAll", () => {
    it("Plan一覧を取得できる", async () => {
      const mockResponse = {
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
      };

      mockPlansService.findAll.mockResolvedValue(mockResponse);

      const result = await plansController.findAll(1, { user: mockSalesUser });

      expect(result).toEqual(mockResponse);
      expect(mockPlansService.findAll).toHaveBeenCalledWith(1, mockSalesUser);
    });
  });

  describe("create", () => {
    it("PLN-001: Planを登録できる", async () => {
      const mockResponse = {
        success: true,
        data: {
          plan_id: 1,
          content: "A社に見積書を提出する",
          comment_count: 0,
          created_at: "2026-02-15T09:00:00.000Z",
          updated_at: "2026-02-15T09:00:00.000Z",
        },
      };

      mockPlansService.create.mockResolvedValue(mockResponse);

      const dto = {
        content: "A社に見積書を提出する",
      };

      const result = await plansController.create(1, dto, { user: mockSalesUser });

      expect(result).toEqual(mockResponse);
      expect(mockPlansService.create).toHaveBeenCalledWith(1, dto, mockSalesUser);
    });
  });

  describe("update", () => {
    it("PLN-010: Planを更新できる", async () => {
      const mockResponse = {
        success: true,
        data: {
          plan_id: 1,
          content: "更新された計画内容",
          comment_count: 1,
          created_at: "2026-02-15T09:00:00.000Z",
          updated_at: "2026-02-15T15:00:00.000Z",
        },
      };

      mockPlansService.update.mockResolvedValue(mockResponse);

      const dto = {
        content: "更新された計画内容",
      };

      const result = await plansController.update(1, dto, { user: mockSalesUser });

      expect(result).toEqual(mockResponse);
      expect(mockPlansService.update).toHaveBeenCalledWith(1, dto, mockSalesUser);
    });
  });

  describe("remove", () => {
    it("PLN-012: Planを削除できる", async () => {
      const mockResponse = {
        success: true,
        message: "計画を削除しました",
      };

      mockPlansService.remove.mockResolvedValue(mockResponse);

      const result = await plansController.remove(1, { user: mockSalesUser });

      expect(result).toEqual(mockResponse);
      expect(mockPlansService.remove).toHaveBeenCalledWith(1, mockSalesUser);
    });
  });
});
