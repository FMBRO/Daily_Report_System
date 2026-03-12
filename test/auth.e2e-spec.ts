import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

/**
 * E2E-AUTH: 認証フローのE2Eテスト
 *
 * テスト仕様書 セクション15（回帰テスト）に基づく
 * - ログイン機能
 * - 認証API呼び出し
 * - ログアウト機能
 */
describe("Authentication E2E (E2E-AUTH)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // グローバルプレフィックス
    app.setGlobalPrefix("v1");

    // バリデーションパイプ
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe("POST /v1/auth/login", () => {
    it("E2E-AUTH-001: 正常ログイン → 認証API呼び出し → ログアウト", async () => {
      // 1. ログイン
      const loginResponse = await request(app.getHttpServer())
        .post("/v1/auth/login")
        .send({
          email: "tanaka@example.com",
          password: "password123",
        })
        .expect(200);

      expect(loginResponse.body).toEqual({
        success: true,
        data: {
          accessToken: expect.any(String),
          user: {
            id: expect.any(Number),
            name: "田中太郎",
            email: "tanaka@example.com",
            role: "sales",
          },
        },
      });

      const { accessToken } = loginResponse.body.data;

      // 2. 認証API呼び出し（/me）
      const meResponse = await request(app.getHttpServer())
        .get("/v1/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(meResponse.body).toEqual({
        success: true,
        data: {
          id: expect.any(Number),
          name: "田中太郎",
          email: "tanaka@example.com",
          role: "sales",
          managerId: expect.any(Number),
          manager: {
            id: expect.any(Number),
            name: "鈴木部長",
            email: "suzuki@example.com",
          },
        },
      });

      // 3. ログアウト
      const logoutResponse = await request(app.getHttpServer())
        .post("/v1/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(logoutResponse.body).toEqual({
        success: true,
        data: {
          message: "ログアウトしました",
        },
      });
    });

    it("E2E-AUTH-002: 無効な認証情報でログイン失敗", async () => {
      const response = await request(app.getHttpServer())
        .post("/v1/auth/login")
        .send({
          email: "tanaka@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "メールアドレスまたはパスワードが正しくありません",
        },
      });
    });

    it("E2E-AUTH-003: 存在しないユーザーでログイン失敗", async () => {
      const response = await request(app.getHttpServer())
        .post("/v1/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "メールアドレスまたはパスワードが正しくありません",
        },
      });
    });

    it("E2E-AUTH-004: バリデーションエラー（メールアドレス形式不正）", async () => {
      const response = await request(app.getHttpServer())
        .post("/v1/auth/login")
        .send({
          email: "invalid-email",
          password: "password123",
        })
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
        },
      });
    });

    it("E2E-AUTH-005: バリデーションエラー（必須項目なし）", async () => {
      const response = await request(app.getHttpServer()).post("/v1/auth/login").send({}).expect(422);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
        },
      });
    });
  });

  describe("GET /v1/auth/me", () => {
    it("E2E-AUTH-010: 無効なトークンでAPIアクセス拒否", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
        },
      });
    });

    it("E2E-AUTH-011: トークンなしでAPIアクセス拒否", async () => {
      const response = await request(app.getHttpServer()).get("/v1/auth/me").expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
        },
      });
    });
  });

  describe("POST /v1/auth/logout", () => {
    it("E2E-AUTH-020: トークンなしでログアウト失敗", async () => {
      const response = await request(app.getHttpServer()).post("/v1/auth/logout").expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
        },
      });
    });
  });
});
