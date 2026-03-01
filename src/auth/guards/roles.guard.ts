import { Injectable, ForbiddenException } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { Reflector } from "@nestjs/core";
import type { Role } from "../decorators/roles.decorator";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthenticatedUser } from "../strategies/jwt.strategy";

/**
 * ロール階層の定義
 * 上位ロールは下位ロールの権限を継承する
 */
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  admin: ["admin", "manager", "sales"],
  manager: ["manager", "sales"],
  sales: ["sales"],
};

/**
 * 指定されたロールが要求されたロールのいずれかにアクセスできるか確認
 */
export function hasRole(userRole: string, requiredRoles: Role[]): boolean {
  const allowedRoles = ROLE_HIERARCHY[userRole as Role] ?? [];
  return requiredRoles.some((role) => allowedRoles.includes(role));
}

/**
 * ロールベースアクセス制御ガード
 *
 * @example
 * ```typescript
 * @Roles('admin', 'manager')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * async getReports() { ... }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // @Roles() デコレータが設定されていない場合は許可
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "アクセス権限がありません",
      });
    }

    if (!hasRole(user.role, requiredRoles)) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "この操作を行う権限がありません",
      });
    }

    return true;
  }
}
