import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { ReportStatus } from "@prisma/client";

/**
 * 日報一覧取得クエリDTO
 */
export class ReportQueryDto {
  @ApiPropertyOptional({
    description: "営業IDでフィルタ",
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: "salesperson_idは整数で入力してください" })
  @IsOptional()
  salesperson_id?: number;

  @ApiPropertyOptional({
    description: "開始日（YYYY-MM-DD）",
    example: "2026-02-01",
  })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate({ message: "date_fromは有効な日付で入力してください" })
  @IsOptional()
  date_from?: Date;

  @ApiPropertyOptional({
    description: "終了日（YYYY-MM-DD）",
    example: "2026-02-28",
  })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate({ message: "date_toは有効な日付で入力してください" })
  @IsOptional()
  date_to?: Date;

  @ApiPropertyOptional({
    description: "ステータス（draft/submitted）",
    enum: ReportStatus,
    example: "submitted",
  })
  @IsEnum(ReportStatus, { message: "statusはdraft/submittedのいずれかを指定してください" })
  @IsOptional()
  status?: ReportStatus;

  @ApiPropertyOptional({
    description: "ページ番号",
    default: 1,
    minimum: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: "pageは整数で入力してください" })
  @Min(1, { message: "pageは1以上を指定してください" })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: "1ページあたりの件数",
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @Type(() => Number)
  @IsInt({ message: "per_pageは整数で入力してください" })
  @Min(1, { message: "per_pageは1以上を指定してください" })
  @Max(100, { message: "per_pageは100以下を指定してください" })
  @IsOptional()
  per_page?: number = 20;
}
