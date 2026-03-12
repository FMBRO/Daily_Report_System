import { ApiProperty } from "@nestjs/swagger";
import type { ReportStatus } from "@prisma/client";

/**
 * 日報作成レスポンスデータDTO
 */
export class CreateReportDataDto {
  @ApiProperty({ description: "日報ID", example: 1 })
  report_id!: number;

  @ApiProperty({ description: "営業担当者ID", example: 1 })
  salesperson_id!: number;

  @ApiProperty({ description: "報告日", example: "2026-02-15" })
  report_date!: string;

  @ApiProperty({ description: "ステータス", enum: ["draft", "submitted"], example: "draft" })
  status!: ReportStatus;

  @ApiProperty({ description: "作成日時", example: "2026-02-15T09:00:00+09:00" })
  created_at!: string;

  @ApiProperty({ description: "更新日時", example: "2026-02-15T09:00:00+09:00" })
  updated_at!: string;
}

/**
 * 日報作成レスポンスDTO
 */
export class CreateReportResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "作成された日報", type: CreateReportDataDto })
  data!: CreateReportDataDto;
}
