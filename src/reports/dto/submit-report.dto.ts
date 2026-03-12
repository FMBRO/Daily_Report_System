import { ApiProperty } from "@nestjs/swagger";

/**
 * 日報提出レスポンスデータDTO
 */
export class SubmitReportDataDto {
  @ApiProperty({ description: "日報ID", example: 1 })
  report_id!: number;

  @ApiProperty({ description: "ステータス", example: "submitted" })
  status!: "submitted";

  @ApiProperty({ description: "提出日時", example: "2026-02-15T18:00:00+09:00" })
  submitted_at!: string;
}

/**
 * 日報提出レスポンスDTO
 */
export class SubmitReportResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "提出結果", type: SubmitReportDataDto })
  data!: SubmitReportDataDto;
}
