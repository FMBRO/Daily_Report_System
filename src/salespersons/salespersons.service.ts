import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  ForbiddenException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { PrismaService } from "../prisma";
import type {
  SalespersonQueryDto,
  SalespersonListResponseDto,
  SalespersonDetailResponseDto,
  SalespersonListItemDto,
  SalespersonDetailDto,
  SalespersonSimpleDto,
  CreateSalespersonDto,
  UpdateSalespersonDto,
  CreateSalespersonResponseDto,
  UpdateSalespersonResponseDto,
  DeleteSalespersonResponseDto,
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

  /**
   * 営業担当者を登録する
   */
  async create(dto: CreateSalespersonDto): Promise<CreateSalespersonResponseDto> {
    const { name, email, password, role, manager_id } = dto;

    // メールアドレス重複チェック
    const existingUser = await this.prisma.salesperson.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UnprocessableEntityException({
        code: "DUPLICATE_ENTRY",
        message: "このメールアドレスは既に登録されています",
      });
    }

    // 上長存在チェック
    if (manager_id !== undefined) {
      const manager = await this.prisma.salesperson.findUnique({
        where: { id: manager_id },
      });

      if (!manager) {
        throw new UnprocessableEntityException({
          code: "VALIDATION_ERROR",
          message: "指定された上長が存在しません",
        });
      }
    }

    // パスワードハッシュ化
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 営業担当者作成
    const salesperson = await this.prisma.salesperson.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        managerId: manager_id,
      },
    });

    return {
      success: true,
      data: {
        salesperson_id: salesperson.id,
      },
    };
  }

  /**
   * 営業担当者を更新する
   */
  async update(id: number, dto: UpdateSalespersonDto): Promise<UpdateSalespersonResponseDto> {
    // 既存ユーザー確認
    const existingUser = await this.prisma.salesperson.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "営業担当者が見つかりません",
      });
    }

    // メールアドレス重複チェック（変更時のみ）
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.prisma.salesperson.findUnique({
        where: { email: dto.email },
      });

      if (emailExists) {
        throw new UnprocessableEntityException({
          code: "DUPLICATE_ENTRY",
          message: "このメールアドレスは既に登録されています",
        });
      }
    }

    // 上長存在チェック（指定時のみ）
    if (dto.manager_id !== undefined) {
      const manager = await this.prisma.salesperson.findUnique({
        where: { id: dto.manager_id },
      });

      if (!manager) {
        throw new UnprocessableEntityException({
          code: "VALIDATION_ERROR",
          message: "指定された上長が存在しません",
        });
      }
    }

    // 更新データの構築
    const updateData: Prisma.SalespersonUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.email !== undefined) {
      updateData.email = dto.email;
    }

    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }

    if (dto.manager_id !== undefined) {
      updateData.manager = { connect: { id: dto.manager_id } };
    }

    // パスワード変更時はハッシュ化
    if (dto.password !== undefined) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(dto.password, saltRounds);
    }

    // 営業担当者更新
    await this.prisma.salesperson.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      data: {
        salesperson_id: id,
      },
    };
  }

  /**
   * 営業担当者を削除する（論理削除）
   */
  async remove(id: number, currentUserId: number): Promise<DeleteSalespersonResponseDto> {
    // 既存ユーザー確認
    const existingUser = await this.prisma.salesperson.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "営業担当者が見つかりません",
      });
    }

    // 自分自身の削除チェック
    if (id === currentUserId) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "自分自身を削除することはできません",
      });
    }

    // 部下存在チェック（有効な部下のみ）
    const subordinateCount = await this.prisma.salesperson.count({
      where: {
        managerId: id,
        isActive: true,
      },
    });

    if (subordinateCount > 0) {
      throw new UnprocessableEntityException({
        code: "VALIDATION_ERROR",
        message: "部下が存在するため削除できません",
      });
    }

    // 論理削除（isActive = false）
    await this.prisma.salesperson.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      success: true,
      data: {
        message: "営業担当者を削除しました",
      },
    };
  }
}
