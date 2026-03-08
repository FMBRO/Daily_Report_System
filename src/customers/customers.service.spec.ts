import { NotFoundException } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("CustomersService", () => {
  let customersService: CustomersService;

  const mockCustomer = {
    id: 1,
    customerName: "株式会社ABC",
    address: "東京都千代田区丸の内1-1-1",
    phone: "03-1234-5678",
    industry: "製造業",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  const mockPrismaService = {
    customer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // 直接インスタンスを作成
    customersService = new CustomersService(mockPrismaService as any);
  });

  describe("findAll", () => {
    // CUS-010: 顧客一覧取得 - 正常系
    it("CUS-010: 認証済みユーザーが顧客一覧を取得できる", async () => {
      const mockCustomers = [
        mockCustomer,
        {
          id: 2,
          customerName: "株式会社XYZ",
          address: "大阪府大阪市北区梅田1-1-1",
          phone: "06-1234-5678",
          industry: "サービス業",
          isActive: true,
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
          updatedAt: new Date("2026-01-02T00:00:00.000Z"),
        },
      ];

      mockPrismaService.customer.count.mockResolvedValue(2);
      mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await customersService.findAll({});

      expect(result).toEqual({
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
      });

      expect(mockPrismaService.customer.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          id: true,
          customerName: true,
          address: true,
          phone: true,
          industry: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          id: "asc",
        },
        skip: 0,
        take: 20,
      });
    });

    // CUS-010: ページネーションが正しく動作すること
    it("CUS-010: ページネーションが正しく動作する", async () => {
      const mockCustomers = [mockCustomer];

      mockPrismaService.customer.count.mockResolvedValue(25);
      mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await customersService.findAll({ page: 2, per_page: 10 });

      expect(result.pagination).toEqual({
        current_page: 2,
        per_page: 10,
        total_pages: 3,
        total_count: 25,
      });

      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          id: true,
          customerName: true,
          address: true,
          phone: true,
          industry: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          id: "asc",
        },
        skip: 10,
        take: 10,
      });
    });

    // CUS-011: キーワード検索
    it("CUS-011: keywordパラメータで顧客名検索ができる", async () => {
      const mockCustomers = [mockCustomer];

      mockPrismaService.customer.count.mockResolvedValue(1);
      mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await customersService.findAll({ keyword: "ABC" });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].customer_name).toBe("株式会社ABC");

      expect(mockPrismaService.customer.count).toHaveBeenCalledWith({
        where: {
          customerName: {
            contains: "ABC",
            mode: "insensitive",
          },
        },
      });
      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: {
          customerName: {
            contains: "ABC",
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          customerName: true,
          address: true,
          phone: true,
          industry: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          id: "asc",
        },
        skip: 0,
        take: 20,
      });
    });

    // CUS-012: 業種フィルタ
    it("CUS-012: industryパラメータで業種フィルタができる", async () => {
      const mockCustomers = [mockCustomer];

      mockPrismaService.customer.count.mockResolvedValue(1);
      mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await customersService.findAll({ industry: "製造業" });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].industry).toBe("製造業");

      expect(mockPrismaService.customer.count).toHaveBeenCalledWith({
        where: {
          industry: {
            contains: "製造業",
            mode: "insensitive",
          },
        },
      });
      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: {
          industry: {
            contains: "製造業",
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          customerName: true,
          address: true,
          phone: true,
          industry: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          id: "asc",
        },
        skip: 0,
        take: 20,
      });
    });

    // CUS-012: 有効フラグフィルタ
    it("CUS-012: is_activeパラメータで有効フラグフィルタができる", async () => {
      const mockActiveCustomer = { ...mockCustomer, isActive: true };

      mockPrismaService.customer.count.mockResolvedValue(1);
      mockPrismaService.customer.findMany.mockResolvedValue([mockActiveCustomer]);

      const result = await customersService.findAll({ is_active: true });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].is_active).toBe(true);

      expect(mockPrismaService.customer.count).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
      });
      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          customerName: true,
          address: true,
          phone: true,
          industry: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          id: "asc",
        },
        skip: 0,
        take: 20,
      });
    });

    // CUS-012: 複数フィルタの組み合わせ
    it("CUS-012: 複数のフィルタを組み合わせて検索できる", async () => {
      const mockCustomers = [mockCustomer];

      mockPrismaService.customer.count.mockResolvedValue(1);
      mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await customersService.findAll({
        keyword: "ABC",
        industry: "製造業",
        is_active: true,
      });

      expect(result.data).toHaveLength(1);

      expect(mockPrismaService.customer.count).toHaveBeenCalledWith({
        where: {
          customerName: {
            contains: "ABC",
            mode: "insensitive",
          },
          industry: {
            contains: "製造業",
            mode: "insensitive",
          },
          isActive: true,
        },
      });
    });
  });

  describe("findOne", () => {
    // CUS-013: 顧客詳細取得 - 正常系
    it("CUS-013: 認証済みユーザーが顧客詳細を取得できる", async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await customersService.findOne(1);

      expect(result).toEqual({
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
      });

      expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          customerName: true,
          address: true,
          phone: true,
          industry: true,
          isActive: true,
          createdAt: true,
        },
      });
    });

    // CUS-014: 存在しない顧客ID
    it("CUS-014: 存在しないcustomer_idで404エラーが返る", async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(customersService.findOne(999)).rejects.toThrow(NotFoundException);

      try {
        await customersService.findOne(999);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).getResponse()).toEqual({
          code: "NOT_FOUND",
          message: "顧客が見つかりません",
        });
      }

      expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        select: {
          id: true,
          customerName: true,
          address: true,
          phone: true,
          industry: true,
          isActive: true,
          createdAt: true,
        },
      });
    });
  });
});
