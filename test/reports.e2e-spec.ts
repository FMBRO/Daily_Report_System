import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

/**
 * E2E-REPORT: 日報フローのE2Eテスト
 *
 * テスト仕様書 セクション15（回帰テスト）に基づく
 * - 日報一覧取得
 * - 日報詳細取得（訪問・Problem・Plan・コメント含む）
 * - 日報提出
 *
 * 注: 日報作成・更新・削除機能は未実装のためスキップ
 */
describe("Reports E2E (E2E-REPORT)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tanakaToken: string;
  let managerToken: string;

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
    const tanakaLogin = await request(app.getHttpServer()).post("/v1/auth/login").send({
      email: "tanaka@example.com",
      password: "password123",
    });
    tanakaToken = tanakaLogin.body.data.accessToken;

    const managerLogin = await request(app.getHttpServer()).post("/v1/auth/login").send({
      email: "suzuki@example.com",
      password: "password123",
    });
    managerToken = managerLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe("GET /v1/reports", () => {
    it("E2E-REPORT-001: 営業担当者が自分の日報一覧を取得できる", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/reports")
        .set("Authorization", `Bearer ${tanakaToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          reports: expect.any(Array),
        },
        pagination: {
          page: 1,
          perPage: 20,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        },
      });

      // 取得した日報が全て田中太郎のものであることを確認
      const reports = response.body.data.reports;
      for (const report of reports) {
        expect(report.salesperson.email).toBe("tanaka@example.com");
      }
    });

    it("E2E-REPORT-002: 上長が部下の日報一覧を取得できる", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/reports")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          reports: expect.any(Array),
        },
        pagination: expect.objectContaining({
          page: 1,
          perPage: 20,
        }),
      });
    });

    it("E2E-REPORT-003: 日報一覧をステータスでフィルタできる", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/reports?status=submitted")
        .set("Authorization", `Bearer ${tanakaToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          reports: expect.any(Array),
        },
      });

      // 取得した日報が全て提出済みであることを確認
      const reports = response.body.data.reports;
      for (const report of reports) {
        expect(report.status).toBe("submitted");
      }
    });

    it("E2E-REPORT-004: ページネーションが機能する", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/reports?page=1&per_page=5")
        .set("Authorization", `Bearer ${tanakaToken}`)
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 1,
        perPage: 5,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });

      // データ件数が5件以下であることを確認
      expect(response.body.data.reports.length).toBeLessThanOrEqual(5);
    });
  });

  describe("GET /v1/reports/:id", () => {
    it("E2E-REPORT-010: 日報詳細を取得できる（訪問・Problem・Plan・コメント含む）", async () => {
      // まず日報一覧を取得して最初の日報IDを取得
      const listResponse = await request(app.getHttpServer())
        .get("/v1/reports")
        .set("Authorization", `Bearer ${tanakaToken}`);

      const reports = listResponse.body.data.reports;
      if (reports.length === 0) {
        // 日報がない場合はスキップ
        console.log("⚠ 日報が存在しないためテストをスキップします");
        return;
      }

      const reportId = reports[0].id;

      // 日報詳細を取得
      const response = await request(app.getHttpServer())
        .get(`/v1/reports/${reportId}`)
        .set("Authorization", `Bearer ${tanakaToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: reportId,
          salespersonId: expect.any(Number),
          reportDate: expect.any(String),
          status: expect.stringMatching(/^(draft|submitted)$/),
          salesperson: {
            id: expect.any(Number),
            name: expect.any(String),
            email: expect.any(String),
          },
          visits: expect.any(Array),
          problems: expect.any(Array),
          plans: expect.any(Array),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      // 訪問データの構造を確認
      if (response.body.data.visits.length > 0) {
        expect(response.body.data.visits[0]).toMatchObject({
          id: expect.any(Number),
          customerId: expect.any(Number),
          visitTime: expect.any(String),
          visitPurpose: expect.any(String),
          customer: {
            id: expect.any(Number),
            customerName: expect.any(String),
          },
        });
      }

      // Problemデータの構造を確認
      if (response.body.data.problems.length > 0) {
        expect(response.body.data.problems[0]).toMatchObject({
          id: expect.any(Number),
          content: expect.any(String),
          priority: expect.stringMatching(/^(high|medium|low)$/),
          comments: expect.any(Array),
        });
      }

      // Planデータの構造を確認
      if (response.body.data.plans.length > 0) {
        expect(response.body.data.plans[0]).toMatchObject({
          id: expect.any(Number),
          content: expect.any(String),
          comments: expect.any(Array),
        });
      }
    });

    it("E2E-REPORT-011: 存在しない日報IDで404エラー", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/reports/999999")
        .set("Authorization", `Bearer ${tanakaToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "日報が見つかりません",
        },
      });
    });
  });

  describe("PATCH /v1/reports/:id/submit", () => {
    it("E2E-REPORT-020: 下書き日報を提出できる", async () => {
      // テスト用に下書き日報を作成（シードデータに存在する場合）
      // 注: 日報作成APIが未実装のため、既存のシードデータを利用

      // 下書き日報があるかチェック
      const listResponse = await request(app.getHttpServer())
        .get("/v1/reports?status=draft")
        .set("Authorization", `Bearer ${tanakaToken}`);

      const draftReports = listResponse.body.data.reports;
      if (draftReports.length === 0) {
        console.log("⚠ 下書き日報が存在しないためテストをスキップします");
        return;
      }

      const reportId = draftReports[0].id;

      // 日報を提出
      const response = await request(app.getHttpServer())
        .patch(`/v1/reports/${reportId}/submit`)
        .set("Authorization", `Bearer ${tanakaToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: reportId,
          status: "submitted",
        },
      });
    });

    it("E2E-REPORT-021: 既に提出済みの日報を再提出しようとすると422エラー", async () => {
      // 提出済み日報を取得
      const listResponse = await request(app.getHttpServer())
        .get("/v1/reports?status=submitted")
        .set("Authorization", `Bearer ${tanakaToken}`);

      const submittedReports = listResponse.body.data.reports;
      if (submittedReports.length === 0) {
        console.log("⚠ 提出済み日報が存在しないためテストをスキップします");
        return;
      }

      const reportId = submittedReports[0].id;

      // 再提出を試みる
      const response = await request(app.getHttpServer())
        .patch(`/v1/reports/${reportId}/submit`)
        .set("Authorization", `Bearer ${tanakaToken}`)
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNPROCESSABLE_ENTITY",
          message: "この日報は既に提出済みです",
        },
      });
    });

    it("E2E-REPORT-022: 存在しない日報IDで404エラー", async () => {
      const response = await request(app.getHttpServer())
        .patch("/v1/reports/999999/submit")
        .set("Authorization", `Bearer ${tanakaToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "日報が見つかりません",
        },
      });
    });
  });
});
