import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { PrismaService } from "../prisma";
import type {
  SalespersonQueryDto,
  SalespersonListResponseDto,
  SalespersonDetailResponseDto,
  SalespersonListItemDto,
  SalespersonDetailDto,
  SalespersonSimpleDto,
} from "./dto";

@Injectable()
export class SalespersonsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 営業担当者一覧を取得する
   */
  async findAll(query: SalespersonQueryDto): Promise<SalespersonListResponseDto> {
    const { keyword, role, manager_id, is_active, page = 1, per_page = 20 } = query;

    // WHERE条件の構築
    const where: Prisma.SalespersonWhereInput = {};

    // キーワード検索（氏名）
    if (keyword) {
      where.name = {
        contains: keyword,
        mode: "insensitive",
      };
    }

    // 役割フィルタ
    if (role) {
      where.role = role;
    }

    // 上長IDフィルタ
    if (manager_id !== undefined) {
      where.managerId = manager_id;
    }

    // 有効フラグフィルタ
    if (is_active !== undefined) {
      where.isActive = is_active;
    }

    // 総件数取得
    const totalCount = await this.prisma.salesperson.count({ where });

    // ページネーション計算
    const totalPages = Math.ceil(totalCount / per_page);
    const skip = (page - 1) * per_page;

    // データ取得
    const salespersons = await this.prisma.salesperson.findMany({
      where,
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
      skip,
      take: per_page,
    });

    // レスポンス形式に変換
    const data: SalespersonListItemDto[] = salespersons.map((s) => ({
      salesperson_id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      manager: s.manager
        ? {
            salesperson_id: s.manager.id,
            name: s.manager.name,
          }
        : null,
      is_active: s.isActive,
      created_at: s.createdAt.toISOString(),
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
   * 営業担当者詳細を取得する
   */
  async findOne(id: number): Promise<SalespersonDetailResponseDto> {
    const salesperson = await this.prisma.salesperson.findUnique({
      where: { id },
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

    if (!salesperson) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "営業担当者が見つかりません",
      });
    }

    // 上長情報の変換
    const manager: SalespersonSimpleDto | null = salesperson.manager
      ? {
          salesperson_id: salesperson.manager.id,
          name: salesperson.manager.name,
        }
      : null;

    // 部下情報の変換
    const subordinates: SalespersonSimpleDto[] = salesperson.subordinates.map((sub) => ({
      salesperson_id: sub.id,
      name: sub.name,
    }));

    // レスポンス形式に変換
    const data: SalespersonDetailDto = {
      salesperson_id: salesperson.id,
      name: salesperson.name,
      email: salesperson.email,
      role: salesperson.role,
      manager,
      subordinates,
      is_active: salesperson.isActive,
      created_at: salesperson.createdAt.toISOString(),
      updated_at: salesperson.updatedAt.toISOString(),
    };

    return {
      success: true,
      data,
    };
  }
}
