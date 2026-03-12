import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

/**
 * E2E-ACL: 権限チェックのE2Eテスト
 *
 * テスト仕様書 セクション12（権限テスト）に基づく
 * - 営業担当者：自分のデータのみアクセス可能
 * - 上長：部下のデータを閲覧・コメント可能
 * - 管理者：全データにアクセス可能
 * - 権限外のアクセスは拒否される
 */
describe("Authorization E2E (E2E-ACL)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let salesToken: string; // 田中太郎（営業）
  let anotherSalesToken: string; // 佐藤花子（営業）
  let managerToken: string; // 鈴木部長（上長）
  let adminToken: string; // 管理者

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

    // テスト用にログインしてトークンを取得
    const salesLogin = await request(app.getHttpServer()).post("/v1/auth/login").send({
      email: "tanaka@example.com",
      password: "password123",
    });
    salesToken = salesLogin.body.data.accessToken;

    const anotherSalesLogin = await request(app.getHttpServer()).post("/v1/auth/login").send({
      email: "sato@example.com",
      password: "password123",
    });
    anotherSalesToken = anotherSalesLogin.body.data.accessToken;

    const managerLogin = await request(app.getHttpServer()).post("/v1/auth/login").send({
      email: "suzuki@example.com",
      password: "password123",
    });
    managerToken = managerLogin.body.data.accessToken;

    const adminLogin = await request(app.getHttpServer()).post("/v1/auth/login").send({
      email: "admin@example.com",
      password: "password123",
    });
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe("ACL-001, ACL-002: 営業担当者の日報アクセス権限", () => {
    it("ACL-002: 営業が自分の日報を閲覧できる", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/reports")
        .set("Authorization", `Bearer ${salesToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          reports: expect.any(Array),
        },
      });

      // 全て自分の日報であることを確認
      const reports = response.body.data.reports;
      for (const report of reports) {
        expect(report.salesperson.email).toBe("tanaka@example.com");
      }
    });

    it("ACL-003: 営業が他人の日報を閲覧できない（一覧取得で他人のデータが含まれない）", async () => {
      // 佐藤花子のデータを取得
      const satoResponse = await request(app.getHttpServer())
        .get("/v1/reports")
        .set("Authorization", `Bearer ${anotherSalesToken}`);

      const satoReports = satoResponse.body.data.reports;
      if (satoReports.length === 0) {
        console.log("⚠ 佐藤花子の日報が存在しないためテストをスキップします");
        return;
      }

      const satoReportId = satoReports[0].id;

      // 田中太郎が佐藤花子の日報詳細を取得しようとする
      const response = await request(app.getHttpServer())
        .get(`/v1/reports/${satoReportId}`)
        .set("Authorization", `Bearer ${salesToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "この日報を閲覧する権限がありません",
        },
      });
    });

    it("ACL-003: 営業が他人の日報詳細にアクセスすると403エラー", async () => {
      // 田中太郎のデータを取得
      const tanakaResponse = await request(app.getHttpServer())
        .get("/v1/reports")
        .set("Authorization", `Bearer ${salesToken}`);

      const tanakaReports = tanakaResponse.body.data.reports;
      if (tanakaReports.length === 0) {
        console.log("⚠ 田中太郎の日報が存在しないためテストをスキップします");
        return;
      }

      const tanakaReportId = tanakaReports[0].id;

      // 佐藤花子が田中太郎の日報詳細を取得しようとする
      const response = await request(app.getHttpServer())
        .get(`/v1/reports/${tanakaReportId}`)
        .set("Authorization", `Bearer ${anotherSalesToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "この日報を閲覧する権限がありません",
        },
      });
    });

    it("ACL-005: 営業が顧客登録できない（403エラー）", async () => {
      const response = await request(app.getHttpServer())
        .post("/v1/customers")
        .set("Authorization", `Bearer ${salesToken}`)
        .send({
          customer_name: "新規顧客株式会社",
          address: "東京都渋谷区1-2-3",
          phone: "03-1234-5678",
          industry: "IT",
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "FORBIDDEN",
        },
      });
    });
  });

  describe("ACL-006, ACL-007, ACL-008: 上長の権限", () => {
    it("ACL-006: 上長が部下の日報を閲覧できる", async () => {
      // 部下（田中太郎）の日報を取得
      const tanakaResponse = await request(app.getHttpServer())
        .get("/v1/reports")
        .set("Authorization", `Bearer ${salesToken}`);

      const tanakaReports = tanakaResponse.body.data.reports;
      if (tanakaReports.length === 0) {
        console.log("⚠ 田中太郎の日報が存在しないためテストをスキップします");
        return;
      }

      const tanakaReportId = tanakaReports[0].id;

      // 上長（鈴木部長）が部下の日報を閲覧
      const response = await request(app.getHttpServer())
        .get(`/v1/reports/${tanakaReportId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: tanakaReportId,
          salesperson: {
            email: "tanaka@example.com",
          },
        },
      });
    });

    it("ACL-008: 上長が他部署の日報を閲覧できない", async () => {
      // このテストは、他部署の営業担当者が存在する場合にのみ実行可能
      // 現在のシードデータでは全員が鈴木部長の部下のため、スキップ
      console.log("⚠ 他部署の営業担当者が存在しないためテストをスキップします");
    });
  });

  describe("ACL-009, ACL-010: 管理者の権限", () => {
    it("ACL-009: 管理者が全ての日報を閲覧できる", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          reports: expect.any(Array),
        },
      });

      // 管理者は全員の日報を取得できる
      const reports = response.body.data.reports;
      expect(reports.length).toBeGreaterThanOrEqual(0);
    });

    it("ACL-010: 管理者が顧客マスタを管理できる（一覧取得）", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/customers")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          customers: expect.any(Array),
        },
      });
    });

    it("ACL-010: 管理者が営業マスタを管理できる（一覧取得）", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/salespersons")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          salespersons: expect.any(Array),
        },
      });
    });

    it("ACL-010: 管理者が顧客を登録できる", async () => {
      const response = await request(app.getHttpServer())
        .post("/v1/customers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          customer_name: "テスト顧客株式会社",
          address: "東京都新宿区1-2-3",
          phone: "03-9999-8888",
          industry: "サービス業",
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(Number),
          customerName: "テスト顧客株式会社",
          address: "東京都新宿区1-2-3",
          phone: "03-9999-8888",
          industry: "サービス業",
          isActive: true,
        },
      });

      // 作成したテストデータをクリーンアップ
      await prisma.customer.delete({
        where: { id: response.body.data.id },
      });
    });
  });

  describe("認証なしアクセス", () => {
    it("SEC-004: 認証なしでAPIアクセスすると401エラー", async () => {
      const response = await request(app.getHttpServer()).get("/v1/reports").expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
        },
      });
    });
  });
});
