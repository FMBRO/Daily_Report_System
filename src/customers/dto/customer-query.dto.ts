import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

/**
 * 顧客一覧取得クエリDTO
 */
export class CustomerQueryDto {
  @ApiPropertyOptional({
    description: "顧客名で検索",
    example: "株式会社",
  })
  @IsString({ message: "keywordは文字列で入力してください" })
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    description: "業種でフィルタ",
    example: "製造業",
  })
  @IsString({ message: "industryは文字列で入力してください" })
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({
    description: "有効フラグでフィルタ",
    example: true,
  })
  @Transform(({ value }) => {
    if (value === "true" || value === true) {
      return true;
    }
    if (value === "false" || value === false) {
      return false;
    }
    return value;
  })
  @IsBoolean({ message: "is_activeは真偽値で入力してください" })
  @IsOptional()
  is_active?: boolean;

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
