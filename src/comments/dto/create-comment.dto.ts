import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

/**
 * Comment作成DTO
 */
export class CreateCommentDto {
  @ApiProperty({
    description: "コメント内容",
    example: "この件について、明日までに対応策を考えましょう",
  })
  @IsString({ message: "内容は文字列で指定してください" })
  @IsNotEmpty({ message: "内容は必須です" })
  content!: string;
}
