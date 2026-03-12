import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

/**
 * Plan作成DTO
 */
export class CreatePlanDto {
  @ApiProperty({
    description: "明日やること",
    example: "A社に見積書を提出する",
  })
  @IsString({ message: "内容は文字列で指定してください" })
  @IsNotEmpty({ message: "内容は必須です" })
  content!: string;
}
