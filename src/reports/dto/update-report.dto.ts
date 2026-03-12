import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDate, IsOptional } from "class-validator";
import type { ReportStatus } from "@prisma/client";

/**
 * 日報更新DTO
 */
export class UpdateReportDto {
  @ApiPropertyOptional({ description: "報告日（YYYY-MM-DD）", example: "2026-02-15" })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate({ message: "report_dateは有効な日付で入力してください" })
  @IsOptional()
  report_date?: Date;
}

/**
 * 日報更新レスポンスデータDTO
 */
export class UpdateReportDataDto {
  @ApiProperty({ description: "日報ID", example: 1 })
  report_id!: number;

  @ApiProperty({ description: "営業担当者ID", example: 1 })
  salesperson_id!: number;

  @ApiProperty({ description: "報告日", example: "2026-02-15" })
  report_date!: string;

  @ApiProperty({ description: "ステータス", enum: ["draft", "submitted"], example: "draft" })
  status!: ReportStatus;

  @ApiProperty({ description: "更新日時", example: "2026-02-15T18:00:00+09:00" })
  updated_at!: string;
}

/**
 * 日報更新レスポンスDTO
 */
export class UpdateReportResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "更新された日報", type: UpdateReportDataDto })
  data!: UpdateReportDataDto;
}

/**
 * 日報削除レスポンスデータDTO
 */
export class DeleteReportDataDto {
  @ApiProperty({ description: "メッセージ", example: "日報を削除しました" })
  message!: string;
}

/**
 * 日報削除レスポンスDTO
 */
export class DeleteReportResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "削除結果", type: DeleteReportDataDto })
  data!: DeleteReportDataDto;
}
