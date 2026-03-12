import { ApiProperty } from "@nestjs/swagger";

/**
 * PlanDTO
 */
export class PlanDto {
  @ApiProperty({ description: "Plan ID", example: 1 })
  plan_id!: number;

  @ApiProperty({ description: "明日やること", example: "A社に見積書を提出する" })
  content!: string;

  @ApiProperty({ description: "コメント数", example: 2 })
  comment_count!: number;

  @ApiProperty({ description: "作成日時", example: "2026-02-15T09:00:00.000Z" })
  created_at!: string;

  @ApiProperty({ description: "更新日時", example: "2026-02-15T09:00:00.000Z" })
  updated_at!: string;
}

/**
 * Plan一覧レスポンスDTO
 */
export class PlanListResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "Plan一覧", type: [PlanDto] })
  data!: PlanDto[];
}

/**
 * Plan詳細レスポンスDTO
 */
export class PlanDetailResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "Plan", type: PlanDto })
  data!: PlanDto;
}

/**
 * Plan削除レスポンスDTO
 */
export class PlanDeleteResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "メッセージ", example: "計画を削除しました" })
  message!: string;
}
