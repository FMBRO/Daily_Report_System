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

  const mockCustomersService = {
    findAll: vi.fn().mockResolvedValue(mockCustomerListResponse),
    findOne: vi.fn().mockResolvedValue(mockCustomerDetailResponse),
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
});
