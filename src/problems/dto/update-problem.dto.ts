import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PriorityEnum } from "./create-problem.dto";

/**
 * Problem更新DTO
 */
export class UpdateProblemDto {
  @ApiPropertyOptional({
    description: "課題・相談内容",
    example: "競合他社が価格攻勢をかけてきている",
  })
  @IsOptional()
  @IsString({ message: "内容は文字列で指定してください" })
  content?: string;

  @ApiPropertyOptional({
    description: "優先度",
    enum: PriorityEnum,
    example: "high",
  })
  @IsOptional()
  @IsEnum(PriorityEnum, { message: "優先度は high, medium, low のいずれかを指定してください" })
  priority?: PriorityEnum;
}
