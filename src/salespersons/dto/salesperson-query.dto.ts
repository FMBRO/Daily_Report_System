import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Role } from "@prisma/client";

/**
 * 営業担当者一覧取得クエリDTO
 */
export class SalespersonQueryDto {
  @ApiPropertyOptional({
    description: "氏名で検索",
    example: "田中",
  })
  @IsString({ message: "keywordは文字列で入力してください" })
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    description: "役割でフィルタ",
    enum: Role,
    example: "sales",
  })
  @IsEnum(Role, { message: "roleはsales/manager/adminのいずれかを指定してください" })
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({
    description: "上長IDでフィルタ",
    example: 10,
  })
  @Type(() => Number)
  @IsInt({ message: "manager_idは整数で入力してください" })
  @IsOptional()
  manager_id?: number;

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
