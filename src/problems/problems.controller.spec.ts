import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProblemsController } from "./problems.controller";
import type { ProblemsService } from "./problems.service";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { PriorityEnum } from "./dto";

describe("ProblemsController", () => {
  let problemsController: ProblemsController;

  const mockSalesUser: AuthenticatedUser = {
    id: 1,
    email: "tanaka@example.com",
    name: "田中 太郎",
    role: "sales" as const,
  };

  const mockProblemsService = {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    problemsController = new ProblemsController(mockProblemsService as unknown as ProblemsService);
  });

  describe("findAll", () => {
    it("Problem一覧を取得できる", async () => {
      const mockResponse = {
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
      };

      mockProblemsService.findAll.mockResolvedValue(mockResponse);

      const result = await problemsController.findAll(1, { user: mockSalesUser });

      expect(result).toEqual(mockResponse);
      expect(mockProblemsService.findAll).toHaveBeenCalledWith(1, mockSalesUser);
    });
  });

  describe("create", () => {
    it("PRB-001: Problemを登録できる", async () => {
      const mockResponse = {
        success: true,
        data: {
          problem_id: 1,
          content: "競合他社が価格攻勢をかけてきている",
          priority: "high",
          comment_count: 0,
          created_at: "2026-02-15T09:00:00.000Z",
          updated_at: "2026-02-15T09:00:00.000Z",
        },
      };

      mockProblemsService.create.mockResolvedValue(mockResponse);

      const dto = {
        content: "競合他社が価格攻勢をかけてきている",
        priority: PriorityEnum.HIGH,
      };

      const result = await problemsController.create(1, dto, { user: mockSalesUser });

      expect(result).toEqual(mockResponse);
      expect(mockProblemsService.create).toHaveBeenCalledWith(1, dto, mockSalesUser);
    });
  });

  describe("update", () => {
    it("PRB-010: Problemを更新できる", async () => {
      const mockResponse = {
        success: true,
        data: {
          problem_id: 1,
          content: "更新された課題内容",
          priority: "low",
          comment_count: 1,
          created_at: "2026-02-15T09:00:00.000Z",
          updated_at: "2026-02-15T15:00:00.000Z",
        },
      };

      mockProblemsService.update.mockResolvedValue(mockResponse);

      const dto = {
        content: "更新された課題内容",
        priority: PriorityEnum.LOW,
      };

      const result = await problemsController.update(1, dto, { user: mockSalesUser });

      expect(result).toEqual(mockResponse);
      expect(mockProblemsService.update).toHaveBeenCalledWith(1, dto, mockSalesUser);
    });
  });

  describe("remove", () => {
    it("PRB-012: Problemを削除できる", async () => {
      const mockResponse = {
        success: true,
        message: "課題・相談を削除しました",
      };

      mockProblemsService.remove.mockResolvedValue(mockResponse);

      const result = await problemsController.remove(1, { user: mockSalesUser });

      expect(result).toEqual(mockResponse);
      expect(mockProblemsService.remove).toHaveBeenCalledWith(1, mockSalesUser);
    });
  });
});
