import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

/**
 * JWT認証ガード
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest<T>(err: Error | null, user: T, info?: Error): T {
    // トークン期限切れの場合
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException({
        code: "TOKEN_EXPIRED",
        message: "トークンの有効期限が切れています",
      });
    }

    // トークン不正の場合
    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "無効なトークンです",
      });
    }

    // その他のエラーまたはユーザー情報がない場合
    if (err || !user) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      });
    }

    return user;
  }
}
