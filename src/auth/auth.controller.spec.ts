import { AuthController } from "./auth.controller";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("AuthController", () => {
  let authController: AuthController;

  const mockLoginResponse = {
    access_token: "mock-jwt-token",
    token_type: "Bearer" as const,
    expires_in: 3600,
    user: {
      salesperson_id: 1,
      name: "田中 太郎",
      email: "tanaka@example.com",
      role: "sales" as const,
    },
  };

  const mockLogoutResponse = {
    message: "ログアウトしました",
  };

  const mockMeResponse = {
    success: true,
    data: {
      salesperson_id: 1,
      name: "田中 太郎",
      email: "tanaka@example.com",
      role: "sales" as const,
      manager: {
        salesperson_id: 10,
        name: "鈴木 部長",
      },
    },
  };

  const mockAuthService = {
    login: vi.fn().mockResolvedValue(mockLoginResponse),
    logout: vi.fn().mockReturnValue(mockLogoutResponse),
    getMe: vi.fn().mockResolvedValue(mockMeResponse),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // 直接インスタンスを作成
    authController = new AuthController(mockAuthService as any);
  });

  describe("login", () => {
    it("正常なログインリクエストを処理できる", async () => {
      const loginDto = {
        email: "tanaka@example.com",
        password: "password123",
      };

      const result = await authController.login(loginDto);

      expect(result).toEqual(mockLoginResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe("logout", () => {
    // AUTH-010: 正常ログアウト
    it("AUTH-010: 正常なログアウトリクエストを処理できる", () => {
      const result = authController.logout();

      expect(result).toEqual(mockLogoutResponse);
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe("me", () => {
    // AUTH-011: 現在のユーザー情報取得
    it("AUTH-011: 認証済みユーザーの情報を取得できる", async () => {
      const mockUser = {
        id: 1,
        email: "tanaka@example.com",
        name: "田中 太郎",
        role: "sales" as const,
      };

      const result = await authController.me(mockUser);

      expect(result).toEqual(mockMeResponse);
      expect(mockAuthService.getMe).toHaveBeenCalledWith(1);
    });
  });
});
