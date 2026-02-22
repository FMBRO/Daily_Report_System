import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

/**
 * ログインリクエストDTO
 */
export class LoginDto {
  @ApiProperty({
    description: "メールアドレス",
    example: "tanaka@example.com",
  })
  @IsEmail({}, { message: "有効なメールアドレスを入力してください" })
  @IsNotEmpty({ message: "メールアドレスは必須です" })
  email!: string;

  @ApiProperty({
    description: "パスワード",
    example: "password123",
  })
  @IsString({ message: "パスワードは文字列で入力してください" })
  @IsNotEmpty({ message: "パスワードは必須です" })
  password!: string;
}
