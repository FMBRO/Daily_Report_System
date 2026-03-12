import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

/**
 * Plan更新DTO
 */
export class UpdatePlanDto {
  @ApiPropertyOptional({
    description: "明日やること",
    example: "A社に見積書を提出する",
  })
  @IsOptional()
  @IsString({ message: "内容は文字列で指定してください" })
  content?: string;
}
