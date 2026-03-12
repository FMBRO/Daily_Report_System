import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { PrismaService } from "../prisma";
import type {
  CreateCustomerDto,
  CustomerQueryDto,
  CustomerListResponseDto,
  CustomerDetailResponseDto,
  CustomerListItemDto,
  CustomerDetailDto,
  UpdateCustomerDto,
} from "./dto";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 顧客一覧を取得する
   */
  async findAll(query: CustomerQueryDto): Promise<CustomerListResponseDto> {
    const { keyword, industry, is_active, page = 1, per_page = 20 } = query;

    // WHERE条件の構築
    const where: Prisma.CustomerWhereInput = {};

    // キーワード検索（顧客名）
    if (keyword) {
      where.customerName = {
        contains: keyword,
        mode: "insensitive",
      };
    }

    // 業種フィルタ
    if (industry) {
      where.industry = {
        contains: industry,
        mode: "insensitive",
      };
    }

    // 有効フラグフィルタ
    if (is_active !== undefined) {
      where.isActive = is_active;
    }

    // 総件数取得
    const totalCount = await this.prisma.customer.count({ where });

    // ページネーション計算
    const totalPages = Math.ceil(totalCount / per_page);
    const skip = (page - 1) * per_page;

    // データ取得
    const customers = await this.prisma.customer.findMany({
      where,
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
      skip,
      take: per_page,
    });

    // レスポンス形式に変換
    const data: CustomerListItemDto[] = customers.map((c) => ({
      customer_id: c.id,
      customer_name: c.customerName,
      address: c.address,
      phone: c.phone,
      industry: c.industry,
      is_active: c.isActive,
      created_at: c.createdAt.toISOString(),
    }));

    return {
      success: true,
      data,
      pagination: {
        current_page: page,
        per_page,
        total_pages: totalPages,
        total_count: totalCount,
      },
    };
  }

  /**
   * 顧客詳細を取得する
   */
  async findOne(id: number): Promise<CustomerDetailResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
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

    if (!customer) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "顧客が見つかりません",
      });
    }

    // レスポンス形式に変換
    const data: CustomerDetailDto = {
      customer_id: customer.id,
      customer_name: customer.customerName,
      address: customer.address,
      phone: customer.phone,
      industry: customer.industry,
      is_active: customer.isActive,
      created_at: customer.createdAt.toISOString(),
    };

    return {
      success: true,
      data,
    };
  }

  /**
   * 顧客を登録する
   */
  async create(dto: CreateCustomerDto): Promise<CustomerDetailResponseDto> {
    const customer = await this.prisma.customer.create({
      data: {
        customerName: dto.customer_name,
        address: dto.address ?? null,
        phone: dto.phone ?? null,
        industry: dto.industry ?? null,
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
    });

    const data: CustomerDetailDto = {
      customer_id: customer.id,
      customer_name: customer.customerName,
      address: customer.address,
      phone: customer.phone,
      industry: customer.industry,
      is_active: customer.isActive,
      created_at: customer.createdAt.toISOString(),
    };

    return {
      success: true,
      data,
    };
  }

  /**
   * 顧客を更新する
   */
  async update(id: number, dto: UpdateCustomerDto): Promise<CustomerDetailResponseDto> {
    // 存在チェック
    const existing = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "顧客が見つかりません",
      });
    }

    // 更新データを構築
    const updateData: {
      customerName?: string;
      address?: string | null;
      phone?: string | null;
      industry?: string | null;
      isActive?: boolean;
    } = {};

    if (dto.customer_name !== undefined) {
      updateData.customerName = dto.customer_name;
    }
    if (dto.address !== undefined) {
      updateData.address = dto.address;
    }
    if (dto.phone !== undefined) {
      updateData.phone = dto.phone;
    }
    if (dto.industry !== undefined) {
      updateData.industry = dto.industry;
    }
    if (dto.is_active !== undefined) {
      updateData.isActive = dto.is_active;
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        customerName: true,
        address: true,
        phone: true,
        industry: true,
        isActive: true,
        updatedAt: true,
      },
    });

    const data: CustomerDetailDto & { updated_at: string } = {
      customer_id: customer.id,
      customer_name: customer.customerName,
      address: customer.address,
      phone: customer.phone,
      industry: customer.industry,
      is_active: customer.isActive,
      created_at: customer.updatedAt.toISOString(),
      updated_at: customer.updatedAt.toISOString(),
    };

    return {
      success: true,
      data,
    };
  }

  /**
   * 顧客を削除する（論理削除）
   */
  async remove(id: number): Promise<{ success: boolean; data: { message: string } }> {
    // 存在チェック
    const existing = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "顧客が見つかりません",
      });
    }

    // 論理削除（is_active を false に更新）
    await this.prisma.customer.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return {
      success: true,
      data: {
        message: "顧客を削除しました",
      },
    };
  }
}
