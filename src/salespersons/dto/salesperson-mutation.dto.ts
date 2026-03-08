import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Role } from "@prisma/client";

/**
 * 営業担当者登録DTO
 */
export class CreateSalespersonDto {
  @ApiProperty({
    description: "氏名",
    example: "田中 太郎",
    maxLength: 100,
  })
  @IsNotEmpty({ message: "氏名は必須です" })
  @IsString({ message: "氏名は文字列で入力してください" })
  @MaxLength(100, { message: "氏名は100文字以内で入力してください" })
  name!: string;

  @ApiProperty({
    description: "メールアドレス",
    example: "tanaka@example.com",
  })
  @IsNotEmpty({ message: "メールアドレスは必須です" })
  @IsEmail({}, { message: "有効なメールアドレスを入力してください" })
  email!: string;

  @ApiProperty({
    description: "パスワード",
    example: "password123",
    minLength: 8,
  })
  @IsNotEmpty({ message: "パスワードは必須です" })
  @IsString({ message: "パスワードは文字列で入力してください" })
  @MinLength(8, { message: "パスワードは8文字以上で入力してください" })
  password!: string;

  @ApiProperty({
    description: "役割",
    enum: Role,
    example: "sales",
  })
  @IsNotEmpty({ message: "役割は必須です" })
  @IsEnum(Role, { message: "役割は sales, manager, admin のいずれかを指定してください" })
  role!: Role;

  @ApiPropertyOptional({
    description: "上長ID",
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: "上長IDは整数で入力してください" })
  manager_id?: number;
}

/**
 * 営業担当者更新DTO
 */
export class UpdateSalespersonDto extends PartialType(CreateSalespersonDto) {}

/**
 * 営業担当者登録レスポンスDTO
 */
export class CreateSalespersonResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({
    description: "登録された営業担当者のID",
    example: { salesperson_id: 1 },
  })
  data!: { salesperson_id: number };
}

/**
 * 営業担当者更新レスポンスDTO
 */
export class UpdateSalespersonResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({
    description: "更新された営業担当者のID",
    example: { salesperson_id: 1 },
  })
  data!: { salesperson_id: number };
}

/**
 * 営業担当者削除レスポンスDTO
 */
export class DeleteSalespersonResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({
    description: "削除メッセージ",
    example: { message: "営業担当者を削除しました" },
  })
  data!: { message: string };
}
