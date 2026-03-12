import { ApiProperty } from "@nestjs/swagger";

/**
 * コメント投稿者DTO
 */
export class CommenterDto {
  @ApiProperty({ description: "営業担当者ID", example: 10 })
  salesperson_id!: number;

  @ApiProperty({ description: "名前", example: "鈴木 部長" })
  name!: string;
}

/**
 * CommentDTO
 */
export class CommentDto {
  @ApiProperty({ description: "Comment ID", example: 1 })
  comment_id!: number;

  @ApiProperty({ description: "コメント投稿者", type: CommenterDto })
  commenter!: CommenterDto;

  @ApiProperty({ description: "コメント内容", example: "この件について、明日までに対応策を考えましょう" })
  content!: string;

  @ApiProperty({ description: "作成日時", example: "2026-02-15T10:30:00.000Z" })
  created_at!: string;
}

/**
 * Comment一覧レスポンスDTO
 */
export class CommentListResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "Comment一覧", type: [CommentDto] })
  data!: CommentDto[];
}

/**
 * Comment詳細レスポンスDTO
 */
export class CommentDetailResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "Comment", type: CommentDto })
  data!: CommentDto;
}

/**
 * Comment削除レスポンスDTO
 */
export class CommentDeleteResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({
    description: "削除結果",
    example: { message: "コメントを削除しました" },
  })
  data!: { message: string };
}
