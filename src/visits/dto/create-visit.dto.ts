import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min } from "class-validator";

/**
 * 訪問記録作成DTO
 */
export class CreateVisitDto {
  @ApiProperty({ description: "顧客ID", example: 1 })
  @IsInt({ message: "顧客IDは整数で指定してください" })
  @Min(1, { message: "顧客IDは1以上の値を指定してください" })
  customer_id!: number;

  @ApiPropertyOptional({
    description: "訪問時刻（HH:mm形式）",
    example: "10:00",
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "訪問時刻はHH:mm形式で指定してください",
  })
  visit_time?: string;

  @ApiPropertyOptional({
    description: "訪問目的",
    example: "定期訪問",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "訪問目的は100文字以内で入力してください" })
  visit_purpose?: string;

  @ApiProperty({
    description: "訪問内容",
    example: "新製品の提案を行った。",
  })
  @IsString({ message: "訪問内容は文字列で指定してください" })
  @IsNotEmpty({ message: "訪問内容は必須です" })
  visit_content!: string;

  @ApiPropertyOptional({
    description: "結果",
    example: "次回見積提出予定",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "結果は100文字以内で入力してください" })
  result?: string;
}
