import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * JWT認証ガード
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest<T>(err: Error | null, user: T): T {
    if (err || !user) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      });
    }
    return user;
  }
}
