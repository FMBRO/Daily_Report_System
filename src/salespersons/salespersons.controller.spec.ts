import { beforeEach, describe, expect, it, vi } from "vitest";
import { SalespersonsController } from "./salespersons.controller";
import type { SalespersonsService } from "./salespersons.service";
import type {
  SalespersonQueryDto,
  SalespersonListResponseDto,
  SalespersonDetailResponseDto,
  CreateSalespersonDto,
  UpdateSalespersonDto,
  CreateSalespersonResponseDto,
  UpdateSalespersonResponseDto,
  DeleteSalespersonResponseDto,
} from "./dto";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

describe("SalespersonsController", () => {
  let controller: SalespersonsController;
  let mockSalespersonsService: {
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const mockListResponse: SalespersonListResponseDto = {
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
    ],
    pagination: {
      current_page: 1,
      per_page: 20,
      total_pages: 1,
      total_count: 1,
    },
  };

  const mockDetailResponse: SalespersonDetailResponseDto = {
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
      subordinates: [],
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-02-15T09:00:00.000Z",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSalespersonsService = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    controller = new SalespersonsController(
      mockSalespersonsService as unknown as SalespersonsService
    );
  });

  describe("findAll", () => {
    it("営業担当者一覧を取得できる", async () => {
      mockSalespersonsService.findAll.mockResolvedValue(mockListResponse);

      const query: SalespersonQueryDto = {
        page: 1,
        per_page: 20,
      };

      const result = await controller.findAll(query);

      expect(result).toEqual(mockListResponse);
      expect(mockSalespersonsService.findAll).toHaveBeenCalledWith(query);
    });

    it("フィルタ条件付きで一覧を取得できる", async () => {
      mockSalespersonsService.findAll.mockResolvedValue(mockListResponse);

      const query: SalespersonQueryDto = {
        keyword: "田中",
        role: "sales",
        manager_id: 10,
        is_active: true,
        page: 1,
        per_page: 20,
      };

      const result = await controller.findAll(query);

      expect(result).toEqual(mockListResponse);
      expect(mockSalespersonsService.findAll).toHaveBeenCalledWith(query);
    });

    it("ページネーション指定で一覧を取得できる", async () => {
      mockSalespersonsService.findAll.mockResolvedValue(mockListResponse);

      const query: SalespersonQueryDto = {
        page: 2,
        per_page: 10,
      };

      const result = await controller.findAll(query);

      expect(result).toEqual(mockListResponse);
      expect(mockSalespersonsService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe("findOne", () => {
    it("営業担当者詳細を取得できる", async () => {
      mockSalespersonsService.findOne.mockResolvedValue(mockDetailResponse);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockDetailResponse);
      expect(mockSalespersonsService.findOne).toHaveBeenCalledWith(1);
    });

    it("異なるIDで詳細を取得できる", async () => {
      const managerResponse: SalespersonDetailResponseDto = {
        success: true,
        data: {
          salesperson_id: 10,
          name: "鈴木 部長",
          email: "suzuki@example.com",
          role: "manager",
          manager: null,
          subordinates: [
            { salesperson_id: 1, name: "田中 太郎" },
            { salesperson_id: 2, name: "佐藤 花子" },
          ],
          is_active: true,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-02-15T09:00:00.000Z",
        },
      };

      mockSalespersonsService.findOne.mockResolvedValue(managerResponse);

      const result = await controller.findOne(10);

      expect(result).toEqual(managerResponse);
      expect(mockSalespersonsService.findOne).toHaveBeenCalledWith(10);
    });
  });

  describe("create", () => {
    it("POST /salespersons - 営業担当者を登録できる", async () => {
      const createDto: CreateSalespersonDto = {
        name: "田中 太郎",
        email: "tanaka@example.com",
        password: "password123",
        role: "sales",
        manager_id: 10,
      };

      const mockCreateResponse: CreateSalespersonResponseDto = {
        success: true,
        data: {
          salesperson_id: 1,
        },
      };

      mockSalespersonsService.create.mockResolvedValue(mockCreateResponse);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCreateResponse);
      expect(mockSalespersonsService.create).toHaveBeenCalledWith(createDto);
    });

    it("上長なしで営業担当者を登録できる", async () => {
      const createDto: CreateSalespersonDto = {
        name: "鈴木 部長",
        email: "suzuki@example.com",
        password: "password123",
        role: "manager",
      };

      const mockCreateResponse: CreateSalespersonResponseDto = {
        success: true,
        data: {
          salesperson_id: 10,
        },
      };

      mockSalespersonsService.create.mockResolvedValue(mockCreateResponse);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCreateResponse);
      expect(mockSalespersonsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe("update", () => {
    it("PUT /salespersons/:id - 営業担当者を更新できる", async () => {
      const updateDto: UpdateSalespersonDto = {
        name: "田中 次郎",
        email: "tanaka_updated@example.com",
      };

      const mockUpdateResponse: UpdateSalespersonResponseDto = {
        success: true,
        data: {
          salesperson_id: 1,
        },
      };

      mockSalespersonsService.update.mockResolvedValue(mockUpdateResponse);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(mockUpdateResponse);
      expect(mockSalespersonsService.update).toHaveBeenCalledWith(1, updateDto);
    });

    it("パスワードのみ更新できる", async () => {
      const updateDto: UpdateSalespersonDto = {
        password: "newpassword456",
      };

      const mockUpdateResponse: UpdateSalespersonResponseDto = {
        success: true,
        data: {
          salesperson_id: 1,
        },
      };

      mockSalespersonsService.update.mockResolvedValue(mockUpdateResponse);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(mockUpdateResponse);
      expect(mockSalespersonsService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe("remove", () => {
    it("DELETE /salespersons/:id - 営業担当者を削除できる", async () => {
      const mockDeleteResponse: DeleteSalespersonResponseDto = {
        success: true,
        data: {
          message: "営業担当者を削除しました",
        },
      };

      const mockRequest = {
        user: {
          id: 10,
          email: "admin@example.com",
          name: "管理者",
          role: "admin" as const,
        } as AuthenticatedUser,
      };

      mockSalespersonsService.remove.mockResolvedValue(mockDeleteResponse);

      const result = await controller.remove(1, mockRequest);

      expect(result).toEqual(mockDeleteResponse);
      expect(mockSalespersonsService.remove).toHaveBeenCalledWith(1, 10);
    });

    it("現在のユーザーIDを正しく渡す", async () => {
      const mockDeleteResponse: DeleteSalespersonResponseDto = {
        success: true,
        data: {
          message: "営業担当者を削除しました",
        },
      };

      const mockRequest = {
        user: {
          id: 5,
          email: "user@example.com",
          name: "ユーザー",
          role: "admin" as const,
        } as AuthenticatedUser,
      };

      mockSalespersonsService.remove.mockResolvedValue(mockDeleteResponse);

      const result = await controller.remove(2, mockRequest);

      expect(result).toEqual(mockDeleteResponse);
      expect(mockSalespersonsService.remove).toHaveBeenCalledWith(2, 5);
    });
  });
});
