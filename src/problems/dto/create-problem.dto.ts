import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

/**
 * 優先度enum
 */
export enum PriorityEnum {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

/**
 * Problem作成DTO
 */
export class CreateProblemDto {
  @ApiProperty({
    description: "課題・相談内容",
    example: "競合他社が価格攻勢をかけてきている",
  })
  @IsString({ message: "内容は文字列で指定してください" })
  @IsNotEmpty({ message: "内容は必須です" })
  content!: string;

  @ApiProperty({
    description: "優先度",
    enum: PriorityEnum,
    example: "high",
  })
  @IsEnum(PriorityEnum, { message: "優先度は high, medium, low のいずれかを指定してください" })
  priority!: PriorityEnum;
}
