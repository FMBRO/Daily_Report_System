import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { Role } from "@prisma/client";
import { PaginationDto } from "../../common/dto";

/**
 * 上長・部下情報DTO（シンプル版）
 */
export class SalespersonSimpleDto {
  @ApiProperty({ description: "営業ID", example: 10 })
  salesperson_id!: number;

  @ApiProperty({ description: "氏名", example: "鈴木 部長" })
  name!: string;
}

/**
 * 営業担当者一覧アイテムDTO
 */
export class SalespersonListItemDto {
  @ApiProperty({ description: "営業ID", example: 1 })
  salesperson_id!: number;

  @ApiProperty({ description: "氏名", example: "田中 太郎" })
  name!: string;

  @ApiProperty({
    description: "メールアドレス",
    example: "tanaka@example.com",
  })
  email!: string;

  @ApiProperty({
    description: "役割",
    enum: ["sales", "manager", "admin"],
    example: "sales",
  })
  role!: Role;

  @ApiPropertyOptional({
    description: "上長情報",
    type: SalespersonSimpleDto,
  })
  manager?: SalespersonSimpleDto | null;

  @ApiProperty({ description: "有効フラグ", example: true })
  is_active!: boolean;

  @ApiProperty({
    description: "作成日時",
    example: "2026-01-01T00:00:00+09:00",
  })
  created_at!: string;
}

/**
 * 営業担当者一覧レスポンスDTO
 */
export class SalespersonListResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({
    description: "営業担当者一覧",
    type: [SalespersonListItemDto],
  })
  data!: SalespersonListItemDto[];

  @ApiProperty({
    description: "ページネーション情報",
    type: PaginationDto,
  })
  pagination!: PaginationDto;
}

/**
 * 営業担当者詳細DTO
 */
export class SalespersonDetailDto {
  @ApiProperty({ description: "営業ID", example: 1 })
  salesperson_id!: number;

  @ApiProperty({ description: "氏名", example: "田中 太郎" })
  name!: string;

  @ApiProperty({
    description: "メールアドレス",
    example: "tanaka@example.com",
  })
  email!: string;

  @ApiProperty({
    description: "役割",
    enum: ["sales", "manager", "admin"],
    example: "sales",
  })
  role!: Role;

  @ApiPropertyOptional({
    description: "上長情報",
    type: SalespersonSimpleDto,
  })
  manager?: SalespersonSimpleDto | null;

  @ApiProperty({
    description: "部下一覧",
    type: [SalespersonSimpleDto],
  })
  subordinates!: SalespersonSimpleDto[];

  @ApiProperty({ description: "有効フラグ", example: true })
  is_active!: boolean;

  @ApiProperty({
    description: "作成日時",
    example: "2026-01-01T00:00:00+09:00",
  })
  created_at!: string;

  @ApiProperty({
    description: "更新日時",
    example: "2026-02-15T09:00:00+09:00",
  })
  updated_at!: string;
}

/**
 * 営業担当者詳細レスポンスDTO
 */
export class SalespersonDetailResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({
    description: "営業担当者詳細",
    type: SalespersonDetailDto,
  })
  data!: SalespersonDetailDto;
}
