import { Injectable, UnauthorizedException } from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { JwtService } from "@nestjs/jwt";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { PrismaService } from "../prisma";
import type { LoginDto, LoginResponseDto, UserInfoDto, MeResponseDto } from "./dto";

/**
 * JWTペイロード
 */
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * ログイン処理
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    // メールアドレスでユーザー検索
    const user = await this.prisma.salesperson.findUnique({
      where: { email },
    });

    // ユーザーが存在しない場合
    if (!user) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "メールアドレスまたはパスワードが正しくありません",
      });
    }

    // 無効なユーザーの場合
    if (!user.isActive) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "メールアドレスまたはパスワードが正しくありません",
      });
    }

    // パスワード検証
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "メールアドレスまたはパスワードが正しくありません",
      });
    }

    // JWTトークン生成
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const expiresIn = this.configService.get<number>("JWT_EXPIRES_IN", 3600);
    const accessToken = this.jwtService.sign(payload);

    // ユーザー情報
    const userInfo: UserInfoDto = {
      salesperson_id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: expiresIn,
      user: userInfo,
    };
  }

  /**
   * ログアウト処理
   * クライアント側でトークンを破棄する想定のため、サーバー側では特に処理なし
   */
  logout(): { message: string } {
    return {
      message: "ログアウトしました",
    };
  }

  /**
   * 現在のユーザー情報取得
   */
  async getMe(userId: number): Promise<MeResponseDto> {
    const user = await this.prisma.salesperson.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        salesperson_id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        manager: user.manager
          ? {
              salesperson_id: user.manager.id,
              name: user.manager.name,
            }
          : null,
      },
    };
  }
}
