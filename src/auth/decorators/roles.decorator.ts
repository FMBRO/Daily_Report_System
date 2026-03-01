import { SetMetadata } from "@nestjs/common";

/**
 * ロール種別
 */
export type Role = "admin" | "manager" | "sales";

/**
 * ロールメタデータのキー
 */
export const ROLES_KEY = "roles";

/**
 * アクセスを許可するロールを指定するデコレータ
 *
 * @example
 * ```typescript
 * @Roles('admin', 'manager')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * async someMethod() { ... }
 * ```
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
