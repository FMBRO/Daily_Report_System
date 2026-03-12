import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Priority } from "@prisma/client";

/**
 * 訪問記録作成DTO
 */
export class CreateVisitDto {
  @ApiProperty({ description: "顧客ID", example: 1 })
  @IsInt({ message: "customer_idは整数で入力してください" })
  customer_id!: number;

  @ApiPropertyOptional({ description: "訪問時刻（HH:mm）", example: "10:00" })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "visit_timeはHH:mm形式で入力してください",
  })
  @IsOptional()
  visit_time?: string;

  @ApiPropertyOptional({ description: "訪問目的", example: "定期訪問" })
  @IsString({ message: "visit_purposeは文字列で入力してください" })
  @MaxLength(100, { message: "visit_purposeは100文字以内で入力してください" })
  @IsOptional()
  visit_purpose?: string;

  @ApiProperty({ description: "訪問内容", example: "新製品の提案を行った。" })
  @IsString({ message: "visit_contentは文字列で入力してください" })
  @IsNotEmpty({ message: "visit_contentは必須です" })
  visit_content!: string;

  @ApiPropertyOptional({ description: "結果", example: "次回見積提出予定" })
  @IsString({ message: "resultは文字列で入力してください" })
  @MaxLength(100, { message: "resultは100文字以内で入力してください" })
  @IsOptional()
  result?: string;
}

/**
 * Problem作成DTO
 */
export class CreateProblemDto {
  @ApiProperty({ description: "課題・相談内容", example: "競合他社が価格攻勢をかけてきている" })
  @IsString({ message: "contentは文字列で入力してください" })
  @IsNotEmpty({ message: "contentは必須です" })
  content!: string;

  @ApiProperty({
    description: "優先度",
    enum: Priority,
    example: "high",
  })
  @IsEnum(Priority, { message: "priorityはhigh/medium/lowのいずれかを指定してください" })
  priority!: Priority;
}

/**
 * Plan作成DTO
 */
export class CreatePlanDto {
  @ApiProperty({ description: "明日やること", example: "A社に見積書を提出する" })
  @IsString({ message: "contentは文字列で入力してください" })
  @IsNotEmpty({ message: "contentは必須です" })
  content!: string;
}

/**
 * 日報作成DTO
 */
export class CreateReportDto {
  @ApiProperty({ description: "報告日（YYYY-MM-DD）", example: "2026-02-15" })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate({ message: "report_dateは有効な日付で入力してください" })
  report_date!: Date;

  @ApiPropertyOptional({
    description: "訪問記録の配列",
    type: [CreateVisitDto],
  })
  @IsArray({ message: "visitsは配列で入力してください" })
  @ValidateNested({ each: true })
  @Type(() => CreateVisitDto)
  @IsOptional()
  visits?: CreateVisitDto[];

  @ApiPropertyOptional({
    description: "Problemの配列",
    type: [CreateProblemDto],
  })
  @IsArray({ message: "problemsは配列で入力してください" })
  @ValidateNested({ each: true })
  @Type(() => CreateProblemDto)
  @IsOptional()
  problems?: CreateProblemDto[];

  @ApiPropertyOptional({
    description: "Planの配列",
    type: [CreatePlanDto],
  })
  @IsArray({ message: "plansは配列で入力してください" })
  @ValidateNested({ each: true })
  @Type(() => CreatePlanDto)
  @IsOptional()
  plans?: CreatePlanDto[];
}
