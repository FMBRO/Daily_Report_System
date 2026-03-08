import { CustomersController } from "./customers.controller";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("CustomersController", () => {
  let customersController: CustomersController;

  const mockCustomerListResponse = {
    success: true,
    data: [
      {
        customer_id: 1,
        customer_name: "株式会社ABC",
        address: "東京都千代田区丸の内1-1-1",
        phone: "03-1234-5678",
        industry: "製造業",
        is_active: true,
        created_at: "2026-01-01T00:00:00.000Z",
      },
      {
        customer_id: 2,
        customer_name: "株式会社XYZ",
        address: "大阪府大阪市北区梅田1-1-1",
        phone: "06-1234-5678",
        industry: "サービス業",
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
  };

  const mockCustomerDetailResponse = {
    success: true,
    data: {
      customer_id: 1,
      customer_name: "株式会社ABC",
      address: "東京都千代田区丸の内1-1-1",
      phone: "03-1234-5678",
      industry: "製造業",
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
    },
  };

  const mockCreateResponse = {
    success: true,
    data: {
      customer_id: 3,
      customer_name: "新規株式会社",
      address: "東京都新宿区西新宿1-1-1",
      phone: "03-9999-8888",
      industry: "IT",
      is_active: true,
      created_at: "2026-02-15T09:00:00.000Z",
    },
  };

  const mockUpdateResponse = {
    success: true,
    data: {
      customer_id: 1,
      customer_name: "株式会社ABC更新",
      address: "東京都千代田区丸の内2-2-2",
      phone: "03-1234-5678",
      industry: "製造業",
      is_active: true,
      created_at: "2026-02-15T18:00:00.000Z",
      updated_at: "2026-02-15T18:00:00.000Z",
    },
  };

  const mockDeleteResponse = {
    success: true,
    data: {
      message: "顧客を削除しました",
    },
  };

  const mockCustomersService = {
    findAll: vi.fn().mockResolvedValue(mockCustomerListResponse),
    findOne: vi.fn().mockResolvedValue(mockCustomerDetailResponse),
    create: vi.fn().mockResolvedValue(mockCreateResponse),
    update: vi.fn().mockResolvedValue(mockUpdateResponse),
    remove: vi.fn().mockResolvedValue(mockDeleteResponse),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // 直接インスタンスを作成
    customersController = new CustomersController(mockCustomersService as any);
  });

  describe("findAll", () => {
    // CUS-010: 顧客一覧取得 - 正常系
    it("CUS-010: 認証済みユーザーが顧客一覧を取得できる", async () => {
      const query = {};

      const result = await customersController.findAll(query);

      expect(result).toEqual(mockCustomerListResponse);
      expect(mockCustomersService.findAll).toHaveBeenCalledWith(query);
    });

    // CUS-010: ページネーションが正しく動作すること
    it("CUS-010: ページネーションパラメータを渡せる", async () => {
      const query = { page: 2, per_page: 10 };

      await customersController.findAll(query);

      expect(mockCustomersService.findAll).toHaveBeenCalledWith(query);
    });

    // CUS-011: キーワード検索
    it("CUS-011: keywordパラメータで顧客名検索ができる", async () => {
      const query = { keyword: "ABC" };

      await customersController.findAll(query);

      expect(mockCustomersService.findAll).toHaveBeenCalledWith(query);
    });

    // CUS-012: 業種フィルタ
    it("CUS-012: industryパラメータで業種フィルタができる", async () => {
      const query = { industry: "製造業" };

      await customersController.findAll(query);

      expect(mockCustomersService.findAll).toHaveBeenCalledWith(query);
    });

    // CUS-012: 有効フラグフィルタ
    it("CUS-012: is_activeパラメータで有効フラグフィルタができる", async () => {
      const query = { is_active: true };

      await customersController.findAll(query);

      expect(mockCustomersService.findAll).toHaveBeenCalledWith(query);
    });

    // CUS-012: 複数フィルタの組み合わせ
    it("CUS-012: 複数のフィルタパラメータを同時に渡せる", async () => {
      const query = {
        keyword: "ABC",
        industry: "製造業",
        is_active: true,
        page: 1,
        per_page: 20,
      };

      await customersController.findAll(query);

      expect(mockCustomersService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe("findOne", () => {
    // CUS-013: 顧客詳細取得 - 正常系
    it("CUS-013: 認証済みユーザーが顧客詳細を取得できる", async () => {
      const result = await customersController.findOne(1);

      expect(result).toEqual(mockCustomerDetailResponse);
      expect(mockCustomersService.findOne).toHaveBeenCalledWith(1);
    });

    // CUS-014: 存在しない顧客ID
    it("CUS-014: 存在しないcustomer_idはサービス層でハンドリングされる", async () => {
      // コントローラーはサービス層の例外をそのまま伝播させる
      const error = new Error("Not Found");
      mockCustomersService.findOne.mockRejectedValue(error);

      await expect(customersController.findOne(999)).rejects.toThrow(error);
      expect(mockCustomersService.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe("create", () => {
    // CUS-001: 顧客登録 - 正常系（全項目）
    it("CUS-001: 全項目を入力して顧客を登録できる", async () => {
      const dto = {
        customer_name: "新規株式会社",
        address: "東京都新宿区西新宿1-1-1",
        phone: "03-9999-8888",
        industry: "IT",
      };

      const result = await customersController.create(dto);

      expect(result).toEqual(mockCreateResponse);
      expect(mockCustomersService.create).toHaveBeenCalledWith(dto);
    });

    // CUS-002: 顧客登録 - 正常系（必須のみ）
    it("CUS-002: customer_nameのみで顧客を登録できる", async () => {
      const dto = {
        customer_name: "新規株式会社",
      };

      await customersController.create(dto);

      expect(mockCustomersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe("update", () => {
    // CUS-020: 顧客更新 - 正常系
    it("CUS-020: 顧客情報を更新できる", async () => {
      const dto = {
        customer_name: "株式会社ABC更新",
        address: "東京都千代田区丸の内2-2-2",
      };

      const result = await customersController.update(1, dto);

      expect(result).toEqual(mockUpdateResponse);
      expect(mockCustomersService.update).toHaveBeenCalledWith(1, dto);
    });

    // 存在しない顧客ID
    it("存在しないcustomer_idはサービス層でハンドリングされる", async () => {
      const error = new Error("Not Found");
      mockCustomersService.update.mockRejectedValue(error);

      const dto = {
        customer_name: "株式会社ABC更新",
      };

      await expect(customersController.update(999, dto)).rejects.toThrow(error);
      expect(mockCustomersService.update).toHaveBeenCalledWith(999, dto);
    });
  });

  describe("remove", () => {
    // CUS-021: 顧客削除（論理削除） - 正常系
    it("CUS-021: 顧客を論理削除できる", async () => {
      const result = await customersController.remove(1);

      expect(result).toEqual(mockDeleteResponse);
      expect(mockCustomersService.remove).toHaveBeenCalledWith(1);
    });

    // 存在しない顧客ID
    it("存在しないcustomer_idはサービス層でハンドリングされる", async () => {
      const error = new Error("Not Found");
      mockCustomersService.remove.mockRejectedValue(error);

      await expect(customersController.remove(999)).rejects.toThrow(error);
      expect(mockCustomersService.remove).toHaveBeenCalledWith(999);
    });
  });
});
