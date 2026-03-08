import {
  NotFoundException,
  UnprocessableEntityException,
  ForbiddenException,
} from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as bcrypt from "bcrypt";
import { SalespersonsService } from "./salespersons.service";
import type { PrismaService } from "../prisma";

// bcryptのモック
vi.mock("bcrypt", () => ({
  hash: vi.fn(),
}));

describe("SalespersonsService", () => {
  let salespersonsService: SalespersonsService;

  const mockManager = {
    id: 10,
    name: "鈴木 部長",
  };

  const mockPrismaService = {
    salesperson: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // 直接インスタンスを作成
    salespersonsService = new SalespersonsService(mockPrismaService as unknown as PrismaService);
  });

  describe("findAll", () => {
    // SLS-010: 一覧取得
    it("SLS-010: 営業担当者一覧を正しく取得できる", async () => {
      const mockSalespersons = [
        {
          id: 1,
          name: "田中 太郎",
          email: "tanaka@example.com",
          role: "sales" as const,
          isActive: true,
          createdAt: new Date("2026-01-01T00:00:00Z"),
          manager: mockManager,
        },
        {
          id: 2,
          name: "佐藤 花子",
          email: "sato@example.com",
          role: "sales" as const,
          isActive: true,
          createdAt: new Date("2026-01-02T00:00:00Z"),
          manager: mockManager,
        },
      ];

      mockPrismaService.salesperson.count.mockResolvedValue(2);
      mockPrismaService.salesperson.findMany.mockResolvedValue(mockSalespersons);

      const result = await salespersonsService.findAll({
        page: 1,
        per_page: 20,
      });

      expect(result).toEqual({
        success: true,
        data: [
          {
            salesperson_id: 1,
            name: "田中 太郎",
            email: "tanaka@example.com",
            role: "sales",
            manager: {
              salesperson_id: 10,
              name: "鈴木 部長",
            },
            is_active: true,
            created_at: "2026-01-01T00:00:00.000Z",
          },
          {
            salesperson_id: 2,
            name: "佐藤 花子",
            email: "sato@example.com",
            role: "sales",
            manager: {
              salesperson_id: 10,
              name: "鈴木 部長",
            },
            is_active: true,
            created_at: "2026-01-02T00:00:00.000Z",
          },
        ],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: 2,
        },
      });

      expect(mockPrismaService.salesperson.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(mockPrismaService.salesperson.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          manager: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
        skip: 0,
        take: 20,
      });
    });

    // SLS-011: 役割フィルタ
    it("SLS-011: roleフィルタで上長のみ取得できる", async () => {
      const mockManagers = [
        {
          id: 10,
          name: "鈴木 部長",
          email: "suzuki@example.com",
          role: "manager" as const,
          isActive: true,
          createdAt: new Date("2026-01-01T00:00:00Z"),
          manager: null,
        },
      ];

      mockPrismaService.salesperson.count.mockResolvedValue(1);
      mockPrismaService.salesperson.findMany.mockResolvedValue(mockManagers);

      const result = await salespersonsService.findAll({
        role: "manager",
        page: 1,
        per_page: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].role).toBe("manager");
      expect(mockPrismaService.salesperson.count).toHaveBeenCalledWith({
        where: { role: "manager" },
      });
      expect(mockPrismaService.salesperson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: "manager" },
        })
      );
    });

    it("keywordフィルタで氏名検索できる", async () => {
      mockPrismaService.salesperson.count.mockResolvedValue(0);
      mockPrismaService.salesperson.findMany.mockResolvedValue([]);

      await salespersonsService.findAll({
        keyword: "田中",
        page: 1,
        per_page: 20,
      });

      expect(mockPrismaService.salesperson.count).toHaveBeenCalledWith({
        where: {
          name: {
            contains: "田中",
            mode: "insensitive",
          },
        },
      });
    });

    it("manager_idフィルタで上長配下のメンバーを取得できる", async () => {
      mockPrismaService.salesperson.count.mockResolvedValue(0);
      mockPrismaService.salesperson.findMany.mockResolvedValue([]);

      await salespersonsService.findAll({
        manager_id: 10,
        page: 1,
        per_page: 20,
      });

      expect(mockPrismaService.salesperson.count).toHaveBeenCalledWith({
        where: { managerId: 10 },
      });
    });

    it("is_activeフィルタで有効なユーザーのみ取得できる", async () => {
      mockPrismaService.salesperson.count.mockResolvedValue(0);
      mockPrismaService.salesperson.findMany.mockResolvedValue([]);

      await salespersonsService.findAll({
        is_active: true,
        page: 1,
        per_page: 20,
      });

      expect(mockPrismaService.salesperson.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });

    it("ページネーションが正しく動作する", async () => {
      mockPrismaService.salesperson.count.mockResolvedValue(50);
      mockPrismaService.salesperson.findMany.mockResolvedValue([]);

      const result = await salespersonsService.findAll({
        page: 2,
        per_page: 10,
      });

      expect(result.pagination).toEqual({
        current_page: 2,
        per_page: 10,
        total_pages: 5,
        total_count: 50,
      });
      expect(mockPrismaService.salesperson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page - 1) * per_page
          take: 10,
        })
      );
    });

    it("上長がいないユーザーの場合managerがnullになる", async () => {
      const mockSalespersonWithoutManager = [
        {
          id: 10,
          name: "鈴木 部長",
          email: "suzuki@example.com",
          role: "manager" as const,
          isActive: true,
          createdAt: new Date("2026-01-01T00:00:00Z"),
          manager: null,
        },
      ];

      mockPrismaService.salesperson.count.mockResolvedValue(1);
      mockPrismaService.salesperson.findMany.mockResolvedValue(mockSalespersonWithoutManager);

      const result = await salespersonsService.findAll({
        page: 1,
        per_page: 20,
      });

      expect(result.data[0].manager).toBeNull();
    });
  });

  describe("findOne", () => {
    // SLS-012: 詳細取得
    it("SLS-012: 営業担当者詳細を正しく取得できる（部下一覧含む）", async () => {
      const mockSalespersonDetail = {
        id: 10,
        name: "鈴木 部長",
        email: "suzuki@example.com",
        role: "manager" as const,
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-02-15T00:00:00Z"),
        manager: null,
        subordinates: [
          {
            id: 1,
            name: "田中 太郎",
          },
          {
            id: 2,
            name: "佐藤 花子",
          },
        ],
      };

      mockPrismaService.salesperson.findUnique.mockResolvedValue(mockSalespersonDetail);

      const result = await salespersonsService.findOne(10);

      expect(result).toEqual({
        success: true,
        data: {
          salesperson_id: 10,
          name: "鈴木 部長",
          email: "suzuki@example.com",
          role: "manager",
          manager: null,
          subordinates: [
            {
              salesperson_id: 1,
              name: "田中 太郎",
            },
            {
              salesperson_id: 2,
              name: "佐藤 花子",
            },
          ],
          is_active: true,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-02-15T00:00:00.000Z",
        },
      });

      expect(mockPrismaService.salesperson.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          manager: {
            select: {
              id: true,
              name: true,
            },
          },
          subordinates: {
            select: {
              id: true,
              name: true,
            },
            where: {
              isActive: true,
            },
            orderBy: {
              id: "asc",
            },
          },
        },
      });
    });

    it("上長がいるユーザーの詳細取得", async () => {
      const mockSalespersonDetail = {
        id: 1,
        name: "田中 太郎",
        email: "tanaka@example.com",
        role: "sales" as const,
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-02-15T00:00:00Z"),
        manager: mockManager,
        subordinates: [],
      };

      mockPrismaService.salesperson.findUnique.mockResolvedValue(mockSalespersonDetail);

      const result = await salespersonsService.findOne(1);

      expect(result.data.manager).toEqual({
        salesperson_id: 10,
        name: "鈴木 部長",
      });
      expect(result.data.subordinates).toEqual([]);
    });

    it("存在しないIDの場合NOT_FOUNDエラー", async () => {
      mockPrismaService.salesperson.findUnique.mockResolvedValue(null);

      await expect(salespersonsService.findOne(999)).rejects.toThrow(NotFoundException);

      try {
        await salespersonsService.findOne(999);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).getResponse()).toEqual({
          code: "NOT_FOUND",
          message: "営業担当者が見つかりません",
        });
      }
    });
  });

  describe("create", () => {
    // SLS-001: 正常登録
    it("SLS-001: 正常に営業担当者を登録できる", async () => {
      const createDto = {
        name: "田中 太郎",
        email: "tanaka@example.com",
        password: "password123",
        role: "sales" as const,
        manager_id: 10,
      };

      const mockCreatedSalesperson = {
        id: 1,
        name: "田中 太郎",
        email: "tanaka@example.com",
        password: "$2b$10$hashedpassword",
        role: "sales" as const,
        isActive: true,
        managerId: 10,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      };

      // メールアドレス重複チェック（なし）
      mockPrismaService.salesperson.findUnique.mockResolvedValue(null);
      // 2回目の呼び出しで上長チェック（存在する）
      mockPrismaService.salesperson.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.salesperson.findUnique.mockResolvedValueOnce(mockManager);
      // bcryptのハッシュ化
      vi.mocked(bcrypt.hash).mockResolvedValue("$2b$10$hashedpassword" as never);
      // 作成
      mockPrismaService.salesperson.create.mockResolvedValue(mockCreatedSalesperson);

      const result = await salespersonsService.create(createDto);

      expect(result).toEqual({
        success: true,
        data: {
          salesperson_id: 1,
        },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(mockPrismaService.salesperson.create).toHaveBeenCalledWith({
        data: {
          name: "田中 太郎",
          email: "tanaka@example.com",
          password: "$2b$10$hashedpassword",
          role: "sales",
          managerId: 10,
        },
      });
    });

    // SLS-002: メールアドレス重複
    it("SLS-002: メールアドレス重複でDUPLICATE_ENTRYエラー", async () => {
      const createDto = {
        name: "田中 太郎",
        email: "tanaka@example.com",
        password: "password123",
        role: "sales" as const,
      };

      const existingUser = {
        id: 2,
        email: "tanaka@example.com",
      };

      mockPrismaService.salesperson.findUnique.mockResolvedValue(existingUser);

      await expect(salespersonsService.create(createDto)).rejects.toThrow(
        UnprocessableEntityException
      );

      try {
        await salespersonsService.create(createDto);
      } catch (error) {
        expect(error).toBeInstanceOf(UnprocessableEntityException);
        expect((error as UnprocessableEntityException).getResponse()).toEqual({
          code: "DUPLICATE_ENTRY",
          message: "このメールアドレスは既に登録されています",
        });
      }
    });

    // SLS-004: 存在しない上長ID
    it("SLS-004: 存在しない上長IDでVALIDATION_ERRORエラー", async () => {
      const createDto = {
        name: "田中 太郎",
        email: "tanaka@example.com",
        password: "password123",
        role: "sales" as const,
        manager_id: 999,
      };

      // メールアドレスチェック（なし）
      mockPrismaService.salesperson.findUnique.mockResolvedValueOnce(null);
      // 上長チェック（存在しない）
      mockPrismaService.salesperson.findUnique.mockResolvedValueOnce(null);

      try {
        await salespersonsService.create(createDto);
      } catch (error) {
        expect(error).toBeInstanceOf(UnprocessableEntityException);
        expect((error as UnprocessableEntityException).getResponse()).toEqual({
          code: "VALIDATION_ERROR",
          message: "指定された上長が存在しません",
        });
      }
    });

    it("パスワードが正しくハッシュ化される", async () => {
      const createDto = {
        name: "田中 太郎",
        email: "tanaka@example.com",
        password: "password123",
        role: "sales" as const,
      };

      const mockCreatedSalesperson = {
        id: 1,
        name: "田中 太郎",
        email: "tanaka@example.com",
        password: "$2b$10$hashedpassword",
        role: "sales" as const,
        isActive: true,
        managerId: null,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      };

      mockPrismaService.salesperson.findUnique.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("$2b$10$hashedpassword" as never);
      mockPrismaService.salesperson.create.mockResolvedValue(mockCreatedSalesperson);

      await salespersonsService.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(mockPrismaService.salesperson.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          password: "$2b$10$hashedpassword",
        }),
      });
    });
  });

  describe("update", () => {
    // SLS-020: 正常更新
    it("SLS-020: 正常に営業担当者を更新できる", async () => {
      const updateDto = {
        name: "田中 次郎",
        email: "tanaka_updated@example.com",
        role: "manager" as const,
      };

      const existingUser = {
        id: 1,
        name: "田中 太郎",
        email: "tanaka@example.com",
        password: "$2b$10$hashedpassword",
        role: "sales" as const,
        isActive: true,
        managerId: 10,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      };

      // 既存ユーザーチェック
      mockPrismaService.salesperson.findUnique.mockResolvedValueOnce(existingUser);
      // メールアドレス重複チェック（なし）
      mockPrismaService.salesperson.findUnique.mockResolvedValueOnce(null);
      // 更新
      mockPrismaService.salesperson.update.mockResolvedValue({
        ...existingUser,
        ...updateDto,
      });

      const result = await salespersonsService.update(1, updateDto);

      expect(result).toEqual({
        success: true,
        data: {
          salesperson_id: 1,
        },
      });

      expect(mockPrismaService.salesperson.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: "田中 次郎",
          email: "tanaka_updated@example.com",
          role: "manager",
        },
      });
    });

    it("存在しないユーザーでNOT_FOUNDエラー", async () => {
      const updateDto = {
        name: "田中 次郎",
      };

      mockPrismaService.salesperson.findUnique.mockResolvedValue(null);

      await expect(salespersonsService.update(999, updateDto)).rejects.toThrow(NotFoundException);

      try {
        await salespersonsService.update(999, updateDto);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).getResponse()).toEqual({
          code: "NOT_FOUND",
          message: "営業担当者が見つかりません",
        });
      }
    });

    it("メールアドレス重複でDUPLICATE_ENTRYエラー", async () => {
      const updateDto = {
        email: "existing@example.com",
      };

      const existingUser = {
        id: 1,
        email: "tanaka@example.com",
      };

      const duplicateUser = {
        id: 2,
        email: "existing@example.com",
      };

      // 既存ユーザーチェック
      mockPrismaService.salesperson.findUnique.mockResolvedValueOnce(existingUser);
      // メールアドレス重複チェック
      mockPrismaService.salesperson.findUnique.mockResolvedValueOnce(duplicateUser);

      try {
        await salespersonsService.update(1, updateDto);
      } catch (error) {
        expect(error).toBeInstanceOf(UnprocessableEntityException);
        expect((error as UnprocessableEntityException).getResponse()).toEqual({
          code: "DUPLICATE_ENTRY",
          message: "このメールアドレスは既に登録されています",
        });
      }
    });

    it("存在しない上長IDでVALIDATION_ERRORエラー", async () => {
      const updateDto = {
        manager_id: 999,
      };

      const existingUser = {
        id: 1,
        email: "tanaka@example.com",
      };

      // 既存ユーザーチェック
      mockPrismaService.salesperson.findUnique.mockResolvedValueOnce(existingUser);
      // 上長チェック（存在しない）
      mockPrismaService.salesperson.findUnique.mockResolvedValueOnce(null);

      try {
        await salespersonsService.update(1, updateDto);
      } catch (error) {
        expect(error).toBeInstanceOf(UnprocessableEntityException);
        expect((error as UnprocessableEntityException).getResponse()).toEqual({
          code: "VALIDATION_ERROR",
          message: "指定された上長が存在しません",
        });
      }
    });

    it("パスワード変更時に正しくハッシュ化される", async () => {
      const updateDto = {
        password: "newpassword456",
      };

      const existingUser = {
        id: 1,
        email: "tanaka@example.com",
        password: "$2b$10$oldhashedpassword",
      };

      mockPrismaService.salesperson.findUnique.mockResolvedValue(existingUser);
      vi.mocked(bcrypt.hash).mockResolvedValue("$2b$10$newhashedpassword" as never);
      mockPrismaService.salesperson.update.mockResolvedValue({
        ...existingUser,
        password: "$2b$10$newhashedpassword",
      });

      await salespersonsService.update(1, updateDto);

      expect(bcrypt.hash).toHaveBeenCalledWith("newpassword456", 10);
      expect(mockPrismaService.salesperson.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          password: "$2b$10$newhashedpassword",
        },
      });
    });
  });

  describe("remove", () => {
    // SLS-021: 正常削除（論理削除）
    it("SLS-021: 正常に営業担当者を削除できる（論理削除）", async () => {
      const existingUser = {
        id: 1,
        name: "田中 太郎",
        email: "tanaka@example.com",
        isActive: true,
      };

      mockPrismaService.salesperson.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.salesperson.count.mockResolvedValue(0); // 部下なし
      mockPrismaService.salesperson.update.mockResolvedValue({
        ...existingUser,
        isActive: false,
      });

      const result = await salespersonsService.remove(1, 10); // currentUserId=10

      expect(result).toEqual({
        success: true,
        data: {
          message: "営業担当者を削除しました",
        },
      });

      expect(mockPrismaService.salesperson.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
      });
    });

    // SLS-022: 自分自身の削除
    it("SLS-022: 自分自身の削除はFORBIDDENエラー", async () => {
      const existingUser = {
        id: 1,
        name: "田中 太郎",
        email: "tanaka@example.com",
      };

      mockPrismaService.salesperson.findUnique.mockResolvedValue(existingUser);

      await expect(salespersonsService.remove(1, 1)).rejects.toThrow(ForbiddenException);

      try {
        await salespersonsService.remove(1, 1); // 自分自身を削除
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as ForbiddenException).getResponse()).toEqual({
          code: "FORBIDDEN",
          message: "自分自身を削除することはできません",
        });
      }
    });

    // SLS-023: 部下がいる場合の削除
    it("SLS-023: 部下がいる場合はVALIDATION_ERRORエラー", async () => {
      const existingUser = {
        id: 10,
        name: "鈴木 部長",
        email: "suzuki@example.com",
      };

      mockPrismaService.salesperson.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.salesperson.count.mockResolvedValue(2); // 部下が2人

      await expect(salespersonsService.remove(10, 1)).rejects.toThrow(UnprocessableEntityException);

      try {
        await salespersonsService.remove(10, 1);
      } catch (error) {
        expect(error).toBeInstanceOf(UnprocessableEntityException);
        expect((error as UnprocessableEntityException).getResponse()).toEqual({
          code: "VALIDATION_ERROR",
          message: "部下が存在するため削除できません",
        });
      }

      expect(mockPrismaService.salesperson.count).toHaveBeenCalledWith({
        where: {
          managerId: 10,
          isActive: true,
        },
      });
    });

    it("存在しないユーザーでNOT_FOUNDエラー", async () => {
      mockPrismaService.salesperson.findUnique.mockResolvedValue(null);

      await expect(salespersonsService.remove(999, 1)).rejects.toThrow(NotFoundException);

      try {
        await salespersonsService.remove(999, 1);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).getResponse()).toEqual({
          code: "NOT_FOUND",
          message: "営業担当者が見つかりません",
        });
      }
    });
  });
});
