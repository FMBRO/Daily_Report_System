import { describe, it, expect, beforeEach } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe("handleRequest", () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      name: "Test User",
      role: "sales",
    };

    it("returns user when authentication is successful", () => {
      const result = guard.handleRequest(null, mockUser);
      expect(result).toEqual(mockUser);
    });

    it("throws UnauthorizedException with TOKEN_EXPIRED code when token is expired", () => {
      const expiredError = new TokenExpiredError("jwt expired", new Date());

      try {
        guard.handleRequest(null, null, expiredError);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          code: "TOKEN_EXPIRED",
          message: "トークンの有効期限が切れています",
        });
      }
    });

    it("throws UnauthorizedException with UNAUTHORIZED code when token is malformed", () => {
      const malformedError = new JsonWebTokenError("jwt malformed");

      try {
        guard.handleRequest(null, null, malformedError);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          code: "UNAUTHORIZED",
          message: "無効なトークンです",
        });
      }
    });

    it("throws UnauthorizedException with UNAUTHORIZED code when token signature is invalid", () => {
      const signatureError = new JsonWebTokenError("invalid signature");

      try {
        guard.handleRequest(null, null, signatureError);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          code: "UNAUTHORIZED",
          message: "無効なトークンです",
        });
      }
    });

    it("throws UnauthorizedException when there is an error", () => {
      const genericError = new Error("Some error");

      try {
        guard.handleRequest(genericError, null);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          code: "UNAUTHORIZED",
          message: "認証が必要です",
        });
      }
    });

    it("throws UnauthorizedException when user is not present", () => {
      try {
        guard.handleRequest(null, null);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          code: "UNAUTHORIZED",
          message: "認証が必要です",
        });
      }
    });

    it("throws UnauthorizedException when user is undefined", () => {
      try {
        guard.handleRequest(null, undefined);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          code: "UNAUTHORIZED",
          message: "認証が必要です",
        });
      }
    });

    it("prioritizes token expired error over missing user", () => {
      const expiredError = new TokenExpiredError("jwt expired", new Date());

      try {
        guard.handleRequest(null, null, expiredError);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          code: "TOKEN_EXPIRED",
          message: "トークンの有効期限が切れています",
        });
      }
    });
  });
});
