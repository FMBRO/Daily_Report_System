import { ApiProperty } from "@nestjs/swagger";
import { PriorityEnum } from "./create-problem.dto";

/**
 * ProblemDTO
 */
export class ProblemDto {
  @ApiProperty({ description: "Problem ID", example: 1 })
  problem_id!: number;

  @ApiProperty({ description: "課題・相談内容", example: "競合他社が価格攻勢をかけてきている" })
  content!: string;

  @ApiProperty({
    description: "優先度",
    enum: PriorityEnum,
    example: "high",
  })
  priority!: string;

  @ApiProperty({ description: "コメント数", example: 2 })
  comment_count!: number;

  @ApiProperty({ description: "作成日時", example: "2026-02-15T09:00:00.000Z" })
  created_at!: string;

  @ApiProperty({ description: "更新日時", example: "2026-02-15T09:00:00.000Z" })
  updated_at!: string;
}

/**
 * Problem一覧レスポンスDTO
 */
export class ProblemListResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "Problem一覧", type: [ProblemDto] })
  data!: ProblemDto[];
}

/**
 * Problem詳細レスポンスDTO
 */
export class ProblemDetailResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "Problem", type: ProblemDto })
  data!: ProblemDto;
}

/**
 * Problem削除レスポンスDTO
 */
export class ProblemDeleteResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "メッセージ", example: "課題・相談を削除しました" })
  message!: string;
}
