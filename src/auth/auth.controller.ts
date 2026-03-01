import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { AuthService } from "./auth.service";
import { LoginDto, LoginResponseDto, LogoutResponseDto, MeResponseDto } from "./dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { AuthenticatedUser } from "./strategies/jwt.strategy";

@ApiTags("認証")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * ログイン
   */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "ログイン",
    description: "ユーザー認証を行い、アクセストークンを取得する",
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "ログイン成功",
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（メールアドレスまたはパスワードが正しくない）",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー",
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * ログアウト
   */
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "ログアウト",
    description: "現在のセッションを終了する",
  })
  @ApiResponse({
    status: 200,
    description: "ログアウト成功",
    type: LogoutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  logout(): LogoutResponseDto {
    return this.authService.logout();
  }

  /**
   * 現在のユーザー情報取得
   */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "現在のユーザー情報取得",
    description: "認証済みユーザーの情報を取得する",
  })
  @ApiResponse({
    status: 200,
    description: "取得成功",
    type: MeResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<MeResponseDto> {
    return this.authService.getMe(user.id);
  }
}
