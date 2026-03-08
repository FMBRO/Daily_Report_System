import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PaginationDto } from "../../common/dto";

/**
 * 顧客一覧アイテムDTO
 */
export class CustomerListItemDto {
  @ApiProperty({ description: "顧客ID", example: 1 })
  customer_id!: number;

  @ApiProperty({ description: "顧客名", example: "株式会社ABC" })
  customer_name!: string;

  @ApiPropertyOptional({
    description: "住所",
    example: "東京都千代田区丸の内1-1-1",
  })
  address?: string | null;

  @ApiPropertyOptional({
    description: "電話番号",
    example: "03-1234-5678",
  })
  phone?: string | null;

  @ApiPropertyOptional({
    description: "業種",
    example: "製造業",
  })
  industry?: string | null;

  @ApiProperty({ description: "有効フラグ", example: true })
  is_active!: boolean;

  @ApiProperty({
    description: "作成日時",
    example: "2026-01-01T00:00:00+09:00",
  })
  created_at!: string;
}

/**
 * 顧客一覧レスポンスDTO
 */
export class CustomerListResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({
    description: "顧客一覧",
    type: [CustomerListItemDto],
  })
  data!: CustomerListItemDto[];

  @ApiProperty({
    description: "ページネーション情報",
    type: PaginationDto,
  })
  pagination!: PaginationDto;
}

/**
 * 顧客詳細DTO
 */
export class CustomerDetailDto {
  @ApiProperty({ description: "顧客ID", example: 1 })
  customer_id!: number;

  @ApiProperty({ description: "顧客名", example: "株式会社ABC" })
  customer_name!: string;

  @ApiPropertyOptional({
    description: "住所",
    example: "東京都千代田区丸の内1-1-1",
  })
  address?: string | null;

  @ApiPropertyOptional({
    description: "電話番号",
    example: "03-1234-5678",
  })
  phone?: string | null;

  @ApiPropertyOptional({
    description: "業種",
    example: "製造業",
  })
  industry?: string | null;

  @ApiProperty({ description: "有効フラグ", example: true })
  is_active!: boolean;

  @ApiProperty({
    description: "作成日時",
    example: "2026-01-01T00:00:00+09:00",
  })
  created_at!: string;
}

/**
 * 顧客詳細レスポンスDTO
 */
export class CustomerDetailResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({
    description: "顧客詳細",
    type: CustomerDetailDto,
  })
  data!: CustomerDetailDto;
}
