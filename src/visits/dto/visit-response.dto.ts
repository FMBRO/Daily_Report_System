import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * 顧客情報DTO
 */
export class VisitCustomerDto {
  @ApiProperty({ description: "顧客ID", example: 1 })
  customer_id!: number;

  @ApiProperty({ description: "顧客名", example: "株式会社ABC" })
  customer_name!: string;
}

/**
 * 訪問記録DTO
 */
export class VisitDto {
  @ApiProperty({ description: "訪問ID", example: 1 })
  visit_id!: number;

  @ApiProperty({ description: "顧客情報", type: VisitCustomerDto })
  customer!: VisitCustomerDto;

  @ApiPropertyOptional({ description: "訪問時刻", example: "10:00" })
  visit_time!: string | null;

  @ApiPropertyOptional({ description: "訪問目的", example: "定期訪問" })
  visit_purpose!: string | null;

  @ApiProperty({ description: "訪問内容", example: "新製品の提案を行った。" })
  visit_content!: string;

  @ApiPropertyOptional({ description: "結果", example: "次回見積提出予定" })
  result!: string | null;

  @ApiProperty({ description: "作成日時", example: "2026-02-15T09:00:00.000Z" })
  created_at!: string;

  @ApiProperty({ description: "更新日時", example: "2026-02-15T09:00:00.000Z" })
  updated_at!: string;
}

/**
 * 訪問記録一覧レスポンスDTO
 */
export class VisitListResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "訪問記録一覧", type: [VisitDto] })
  data!: VisitDto[];
}

/**
 * 訪問記録詳細レスポンスDTO
 */
export class VisitDetailResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "訪問記録", type: VisitDto })
  data!: VisitDto;
}

/**
 * 訪問記録削除レスポンスDTO
 */
export class VisitDeleteResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "メッセージ", example: "訪問記録を削除しました" })
  message!: string;
}
