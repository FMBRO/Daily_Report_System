import { UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JwtPayload } from "../auth.service";

describe("JwtStrategy", () => {
  let jwtStrategy: JwtStrategy;

  const mockUser = {
    id: 1,
    name: "田中 太郎",
    email: "tanaka@example.com",
    role: "sales" as const,
    isActive: true,
  };

  const mockPrismaService = {
    salesperson: {
      findUnique: vi.fn(),
    },
  };

  const mockConfigService = {
    get: vi.fn().mockReturnValue("test-secret-key"),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // 直接インスタンスを作成
    jwtStrategy = new JwtStrategy(
      mockConfigService as unknown as ConfigService,
      mockPrismaService as any
    );
  });

  describe("constructor", () => {
    it("JWT_SECRETが未定義の場合エラーをスローする", () => {
      const mockConfigServiceWithoutSecret = {
        get: vi.fn().mockReturnValue(undefined),
      };

      expect(() => {
        new JwtStrategy(
          mockConfigServiceWithoutSecret as unknown as ConfigService,
          mockPrismaService as any
        );
      }).toThrow("JWT_SECRET is not defined");
    });
  });

  describe("validate", () => {
    const mockPayload: JwtPayload = {
      sub: 1,
      email: "tanaka@example.com",
      role: "sales",
    };

    // AUTH-020: 有効なトークン
    it("AUTH-020: 有効なペイロードで認証成功", async () => {
      mockPrismaService.salesperson.findUnique.mockResolvedValue(mockUser);

      const result = await jwtStrategy.validate(mockPayload);

      expect(result).toEqual({
        id: 1,
        email: "tanaka@example.com",
        name: "田中 太郎",
        role: "sales",
      });

      expect(mockPrismaService.salesperson.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });
    });

    // AUTH-022: 不正なトークン（存在しないユーザー）
    it("AUTH-022: 存在しないユーザーで401エラー", async () => {
      mockPrismaService.salesperson.findUnique.mockResolvedValue(null);

      await expect(jwtStrategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);

      try {
        await jwtStrategy.validate(mockPayload);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          code: "UNAUTHORIZED",
          message: "無効なトークンです",
        });
      }
    });

    // AUTH-006: 無効ユーザー（is_active=false）
    it("AUTH-006: 無効ユーザーで401エラー", async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockPrismaService.salesperson.findUnique.mockResolvedValue(inactiveUser);

      await expect(jwtStrategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);

      try {
        await jwtStrategy.validate(mockPayload);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          code: "UNAUTHORIZED",
          message: "無効なトークンです",
        });
      }
    });

    it("managerロールのユーザーを正しく認証できる", async () => {
      const mockManagerUser = {
        id: 10,
        name: "鈴木 部長",
        email: "suzuki@example.com",
        role: "manager" as const,
        isActive: true,
      };

      const managerPayload: JwtPayload = {
        sub: 10,
        email: "suzuki@example.com",
        role: "manager",
      };

      mockPrismaService.salesperson.findUnique.mockResolvedValue(mockManagerUser);

      const result = await jwtStrategy.validate(managerPayload);

      expect(result).toEqual({
        id: 10,
        email: "suzuki@example.com",
        name: "鈴木 部長",
        role: "manager",
      });
    });

    it("adminロールのユーザーを正しく認証できる", async () => {
      const mockAdminUser = {
        id: 99,
        name: "管理者",
        email: "admin@example.com",
        role: "admin" as const,
        isActive: true,
      };

      const adminPayload: JwtPayload = {
        sub: 99,
        email: "admin@example.com",
        role: "admin",
      };

      mockPrismaService.salesperson.findUnique.mockResolvedValue(mockAdminUser);

      const result = await jwtStrategy.validate(adminPayload);

      expect(result).toEqual({
        id: 99,
        email: "admin@example.com",
        name: "管理者",
        role: "admin",
      });
    });
  });
});
