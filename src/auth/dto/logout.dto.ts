import { ApiProperty } from "@nestjs/swagger";

/**
 * ログアウトレスポンスDTO
 */
export class LogoutResponseDto {
  @ApiProperty({
    description: "ログアウトメッセージ",
    example: "ログアウトしました",
  })
  message!: string;
}
