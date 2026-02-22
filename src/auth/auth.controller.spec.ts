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

  const mockAuthService = {
    login: vi.fn().mockResolvedValue(mockLoginResponse),
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
});