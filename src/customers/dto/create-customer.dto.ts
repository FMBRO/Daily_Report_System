import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * 顧客登録DTO
 */
export class CreateCustomerDto {
  @ApiProperty({
    description: "顧客名",
    example: "株式会社ABC",
    maxLength: 200,
  })
  @IsString({ message: "customer_nameは文字列で入力してください" })
  @IsNotEmpty({ message: "顧客名は必須です" })
  @MaxLength(200, { message: "顧客名は200文字以内で入力してください" })
  customer_name!: string;

  @ApiPropertyOptional({
    description: "住所",
    example: "東京都千代田区丸の内1-1-1",
    maxLength: 500,
  })
  @IsString({ message: "addressは文字列で入力してください" })
  @MaxLength(500, { message: "住所は500文字以内で入力してください" })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: "電話番号",
    example: "03-1234-5678",
    maxLength: 20,
  })
  @IsString({ message: "phoneは文字列で入力してください" })
  @MaxLength(20, { message: "電話番号は20文字以内で入力してください" })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: "業種",
    example: "製造業",
    maxLength: 100,
  })
  @IsString({ message: "industryは文字列で入力してください" })
  @MaxLength(100, { message: "業種は100文字以内で入力してください" })
  @IsOptional()
  industry?: string;
}
