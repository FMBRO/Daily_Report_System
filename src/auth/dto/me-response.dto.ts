import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { Role } from "@prisma/client";

/**
 * 上長情報DTO
 */
export class ManagerInfoDto {
  @ApiProperty({ description: "営業ID", example: 10 })
  salesperson_id!: number;

  @ApiProperty({ description: "氏名", example: "鈴木 部長" })
  name!: string;
}

/**
 * 現在のユーザー情報DTO
 */
export class MeUserDto {
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

  @ApiPropertyOptional({ description: "上長情報", type: ManagerInfoDto })
  manager?: ManagerInfoDto | null;
}

/**
 * GET /auth/me レスポンスDTO
 */
export class MeResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "ユーザー情報", type: MeUserDto })
  data!: MeUserDto;
}
