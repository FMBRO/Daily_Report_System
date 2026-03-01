import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard, ROLE_HIERARCHY, hasRole } from "./roles.guard";
import type { Role } from "../decorators/roles.decorator";
import type { AuthenticatedUser } from "../strategies/jwt.strategy";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockExecutionContext = (user?: AuthenticatedUser): ExecutionContext => {
    return {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({ user }),
      }),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  describe("ROLE_HIERARCHY", () => {
    it("admin has access to all roles", () => {
      expect(ROLE_HIERARCHY.admin).toEqual(["admin", "manager", "sales"]);
    });

    it("manager has access to manager and sales roles", () => {
      expect(ROLE_HIERARCHY.manager).toEqual(["manager", "sales"]);
    });

    it("sales has access to only sales role", () => {
      expect(ROLE_HIERARCHY.sales).toEqual(["sales"]);
    });
  });

  describe("hasRole", () => {
    it("admin can access admin-only resources", () => {
      expect(hasRole("admin", ["admin"])).toBe(true);
    });

    it("admin can access manager resources", () => {
      expect(hasRole("admin", ["manager"])).toBe(true);
    });

    it("admin can access sales resources", () => {
      expect(hasRole("admin", ["sales"])).toBe(true);
    });

    it("manager cannot access admin resources", () => {
      expect(hasRole("manager", ["admin"])).toBe(false);
    });

    it("manager can access manager resources", () => {
      expect(hasRole("manager", ["manager"])).toBe(true);
    });

    it("manager can access sales resources", () => {
      expect(hasRole("manager", ["sales"])).toBe(true);
    });

    it("sales cannot access admin resources", () => {
      expect(hasRole("sales", ["admin"])).toBe(false);
    });

    it("sales cannot access manager resources", () => {
      expect(hasRole("sales", ["manager"])).toBe(false);
    });

    it("sales can access sales resources", () => {
      expect(hasRole("sales", ["sales"])).toBe(true);
    });

    it("returns false for unknown role", () => {
      expect(hasRole("unknown", ["admin"])).toBe(false);
    });

    it("returns true if user can access any of the required roles", () => {
      expect(hasRole("manager", ["admin", "manager"])).toBe(true);
    });
  });

  describe("canActivate", () => {
    it("allows access when no roles are required", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
      const context = createMockExecutionContext({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        role: "sales",
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("allows access when required roles array is empty", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([]);
      const context = createMockExecutionContext({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        role: "sales",
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("allows admin to access admin-only resources", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"] as Role[]);
      const context = createMockExecutionContext({
        id: 1,
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("allows admin to access manager resources", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(["manager"] as Role[]);
      const context = createMockExecutionContext({
        id: 1,
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("allows manager to access manager resources", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(["manager"] as Role[]);
      const context = createMockExecutionContext({
        id: 2,
        email: "manager@example.com",
        name: "Manager User",
        role: "manager",
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("denies manager access to admin-only resources", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"] as Role[]);
      const context = createMockExecutionContext({
        id: 2,
        email: "manager@example.com",
        name: "Manager User",
        role: "manager",
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("denies sales access to admin-only resources", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"] as Role[]);
      const context = createMockExecutionContext({
        id: 3,
        email: "sales@example.com",
        name: "Sales User",
        role: "sales",
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("denies sales access to manager resources", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(["manager"] as Role[]);
      const context = createMockExecutionContext({
        id: 3,
        email: "sales@example.com",
        name: "Sales User",
        role: "sales",
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("throws ForbiddenException with correct error code when user lacks permission", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"] as Role[]);
      const context = createMockExecutionContext({
        id: 3,
        email: "sales@example.com",
        name: "Sales User",
        role: "sales",
      });

      try {
        guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as ForbiddenException).getResponse()).toEqual({
          code: "FORBIDDEN",
          message: "この操作を行う権限がありません",
        });
      }
    });

    it("throws ForbiddenException when user is not present", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"] as Role[]);
      const context = createMockExecutionContext(undefined);

      try {
        guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as ForbiddenException).getResponse()).toEqual({
          code: "FORBIDDEN",
          message: "アクセス権限がありません",
        });
      }
    });

    it("allows access when user has any of the required roles", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin", "manager"] as Role[]);
      const context = createMockExecutionContext({
        id: 2,
        email: "manager@example.com",
        name: "Manager User",
        role: "manager",
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
