import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommentsController } from "./comments.controller";
import type { CommentsService } from "./comments.service";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

describe("CommentsController", () => {
  let commentsController: CommentsController;

  const mockManagerUser: AuthenticatedUser = {
    id: 10,
    email: "suzuki@example.com",
    name: "鈴木 部長",
    role: "manager" as const,
  };

  const mockCommentsService = {
    findByProblem: vi.fn(),
    createForProblem: vi.fn(),
    findByPlan: vi.fn(),
    createForPlan: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    commentsController = new CommentsController(mockCommentsService as unknown as CommentsService);
  });

  describe("findByProblem", () => {
    it("CMT-010: Problemのコメント一覧を取得できる", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            comment_id: 1,
            commenter: {
              salesperson_id: 10,
              name: "鈴木 部長",
            },
            content: "この件について対応策を考えましょう",
            created_at: "2026-02-15T10:30:00.000Z",
          },
        ],
      };

      mockCommentsService.findByProblem.mockResolvedValue(mockResponse);

      const result = await commentsController.findByProblem(1, { user: mockManagerUser });

      expect(result).toEqual(mockResponse);
      expect(mockCommentsService.findByProblem).toHaveBeenCalledWith(1, mockManagerUser);
    });
  });

  describe("createForProblem", () => {
    it("CMT-001: Problemにコメントを投稿できる", async () => {
      const mockResponse = {
        success: true,
        data: {
          comment_id: 1,
          commenter: {
            salesperson_id: 10,
            name: "鈴木 部長",
          },
          content: "この件について対応策を考えましょう",
          created_at: "2026-02-15T10:30:00.000Z",
        },
      };

      mockCommentsService.createForProblem.mockResolvedValue(mockResponse);

      const dto = { content: "この件について対応策を考えましょう" };

      const result = await commentsController.createForProblem(1, dto, { user: mockManagerUser });

      expect(result).toEqual(mockResponse);
      expect(mockCommentsService.createForProblem).toHaveBeenCalledWith(1, dto, mockManagerUser);
    });
  });

  describe("findByPlan", () => {
    it("CMT-011: Planのコメント一覧を取得できる", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            comment_id: 2,
            commenter: {
              salesperson_id: 10,
              name: "鈴木 部長",
            },
            content: "計画について確認させてください",
            created_at: "2026-02-15T11:00:00.000Z",
          },
        ],
      };

      mockCommentsService.findByPlan.mockResolvedValue(mockResponse);

      const result = await commentsController.findByPlan(1, { user: mockManagerUser });

      expect(result).toEqual(mockResponse);
      expect(mockCommentsService.findByPlan).toHaveBeenCalledWith(1, mockManagerUser);
    });
  });

  describe("createForPlan", () => {
    it("CMT-002: Planにコメントを投稿できる", async () => {
      const mockResponse = {
        success: true,
        data: {
          comment_id: 2,
          commenter: {
            salesperson_id: 10,
            name: "鈴木 部長",
          },
          content: "計画について確認させてください",
          created_at: "2026-02-15T11:00:00.000Z",
        },
      };

      mockCommentsService.createForPlan.mockResolvedValue(mockResponse);

      const dto = { content: "計画について確認させてください" };

      const result = await commentsController.createForPlan(1, dto, { user: mockManagerUser });

      expect(result).toEqual(mockResponse);
      expect(mockCommentsService.createForPlan).toHaveBeenCalledWith(1, dto, mockManagerUser);
    });
  });

  describe("remove", () => {
    it("CMT-020: コメントを削除できる", async () => {
      const mockResponse = {
        success: true,
        data: {
          message: "コメントを削除しました",
        },
      };

      mockCommentsService.remove.mockResolvedValue(mockResponse);

      const result = await commentsController.remove(1, { user: mockManagerUser });

      expect(result).toEqual(mockResponse);
      expect(mockCommentsService.remove).toHaveBeenCalledWith(1, mockManagerUser);
    });
  });
});
