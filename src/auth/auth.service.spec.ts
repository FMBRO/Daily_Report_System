import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

// bcryptのモック
vi.mock("bcrypt", () => ({
  compare: vi.fn(),
}));

describe("AuthService", () => {
  let authService: AuthService;

  const mockUser = {
    id: 1,
    name: "田中 太郎",
    email: "tanaka@example.com",
    password: "$2b$10$hashedpassword",
    role: "sales" as const,
    isActive: true,
    managerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    salesperson: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
  };

  const mockJwtService = {
    sign: vi.fn().mockReturnValue("mock-jwt-token"),
  };

  const mockConfigService = {
    get: vi.fn().mockReturnValue(3600),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // 直接インスタンスを作成
    authService = new AuthService(
      mockPrismaService as any,
      mockJwtService as any,
      mockConfigService as any
    );
  });

  describe("login", () => {
    // AUTH-001: 正常ログイン
    it("AUTH-001: 有効な認証情報でログインできる", async () => {
      mockPrismaService.salesperson.findUnique.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await authService.login({
        email: "tanaka@example.com",
        password: "password123",
      });

      expect(result).toEqual({
        access_token: "mock-jwt-token",
        token_type: "Bearer",
        expires_in: 3600,
        user: {
          salesperson_id: 1,
          name: "田中 太郎",
          email: "tanaka@example.com",
          role: "sales",
        },
      });

      expect(mockPrismaService.salesperson.findUnique).toHaveBeenCalledWith({
        where: { email: "tanaka@example.com" },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", mockUser.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: "tanaka@example.com",
        role: "sales",
      });
    });

    // AUTH-002: メールアドレス誤り
    it("AUTH-002: 存在しないメールアドレスで401エラー", async () => {
      mockPrismaService.salesperson.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: "notexist@example.com",
          password: "password123",
        })
      ).rejects.toThrow(UnauthorizedException);

      try {
        await authService.login({
          email: "notexist@example.com",
          password: "password123",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          code: "INVALID_CREDENTIALS",
          message: "メールアドレスまたはパスワードが正しくありません",
        });
      }
    });

    // AUTH-003: パスワード誤り
    it("AUTH-003: 誤ったパスワードで401エラー", async () => {
      mockPrismaService.salesperson.findUnique.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        authService.login({
          email: "tanaka@example.com",
          password: "wrongpassword",
        })
      ).rejects.toThrow(UnauthorizedException);

      try {
        await authService.login({
          email: "tanaka@example.com",
          password: "wrongpassword",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          code: "INVALID_CREDENTIALS",
          message: "メールアドレスまたはパスワードが正しくありません",
        });
      }
    });

    // AUTH-006: 無効ユーザーのログイン
    it("AUTH-006: 無効ユーザーは401エラー", async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockPrismaService.salesperson.findUnique.mockResolvedValue(inactiveUser);

      await expect(
        authService.login({
          email: "tanaka@example.com",
          password: "password123",
        })
      ).rejects.toThrow(UnauthorizedException);

      try {
        await authService.login({
          email: "tanaka@example.com",
          password: "password123",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          code: "INVALID_CREDENTIALS",
          message: "メールアドレスまたはパスワードが正しくありません",
        });
      }
    });
  });

  describe("logout", () => {
    // AUTH-010: 正常ログアウト
    it("AUTH-010: 正常にログアウトできる", () => {
      const result = authService.logout();

      expect(result).toEqual({
        message: "ログアウトしました",
      });
    });
  });

  describe("getMe", () => {
    // AUTH-011: 現在のユーザー情報取得（上長あり）
    it("AUTH-011: 上長がいるユーザーの情報を正しく取得できる", async () => {
      const mockUserWithManager = {
        id: 1,
        name: "田中 太郎",
        email: "tanaka@example.com",
        role: "sales" as const,
        manager: {
          id: 10,
          name: "鈴木 部長",
        },
      };

      mockPrismaService.salesperson.findUniqueOrThrow.mockResolvedValue(mockUserWithManager);

      const result = await authService.getMe(1);

      expect(result).toEqual({
        success: true,
        data: {
          salesperson_id: 1,
          name: "田中 太郎",
          email: "tanaka@example.com",
          role: "sales",
          manager: {
            salesperson_id: 10,
            name: "鈴木 部長",
          },
        },
      });

      expect(mockPrismaService.salesperson.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          manager: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    // AUTH-012: 現在のユーザー情報取得（上長なし）
    it("AUTH-012: 上長がいないユーザーの情報を正しく取得できる", async () => {
      const mockUserWithoutManager = {
        id: 10,
        name: "鈴木 部長",
        email: "suzuki@example.com",
        role: "manager" as const,
        manager: null,
      };

      mockPrismaService.salesperson.findUniqueOrThrow.mockResolvedValue(mockUserWithoutManager);

      const result = await authService.getMe(10);

      expect(result).toEqual({
        success: true,
        data: {
          salesperson_id: 10,
          name: "鈴木 部長",
          email: "suzuki@example.com",
          role: "manager",
          manager: null,
        },
      });

      expect(mockPrismaService.salesperson.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 10 },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          manager: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });
  });
});
