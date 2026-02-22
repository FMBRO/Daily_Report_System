import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { AuthService } from "./auth.service";
import { LoginDto, LoginResponseDto } from "./dto";

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
}