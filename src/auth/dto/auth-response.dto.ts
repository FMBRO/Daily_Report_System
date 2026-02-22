import { ApiProperty } from "@nestjs/swagger";
import type { Role } from "@prisma/client";

/**
 * ユーザー情報DTO
 */
export class UserInfoDto {
  @ApiProperty({ description: "営業ID", example: 1 })
  salesperson_id!: number;

  @ApiProperty({ description: "氏名", example: "田中 太郎" })
  name!: string;

  @ApiProperty({ description: "メールアドレス", example: "tanaka@example.com" })
  email!: string;

  @ApiProperty({
    description: "権限",
    enum: ["sales", "manager", "admin"],
    example: "sales",
  })
  role!: Role;
}

/**
 * ログインレスポンスDTO
 */
export class LoginResponseDto {
  @ApiProperty({
    description: "アクセストークン",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  access_token!: string;

  @ApiProperty({ description: "トークンタイプ", example: "Bearer" })
  token_type!: string;

  @ApiProperty({
    description: "トークン有効期限（秒）",
    example: 3600,
  })
  expires_in!: number;

  @ApiProperty({ description: "ユーザー情報", type: UserInfoDto })
  user!: UserInfoDto;
}
