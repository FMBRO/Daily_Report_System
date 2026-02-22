import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  // グローバルプレフィックス
  app.setGlobalPrefix("v1");

  // バリデーションパイプ
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTOに定義されていないプロパティを除去
      forbidNonWhitelisted: true, // 未定義プロパティがあればエラー
      transform: true, // 自動型変換
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // CORS設定
  app.enableCors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Swagger設定
  const config = new DocumentBuilder()
    .setTitle("営業日報システム API")
    .setDescription("営業担当者が日々の顧客訪問活動を報告し、上長がフィードバックを行うためのAPI")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        description: "JWTトークンを入力してください",
        in: "header",
      },
      "access-token"
    )
    .addTag("auth", "認証")
    .addTag("reports", "日報")
    .addTag("visits", "訪問記録")
    .addTag("problems", "Problem（課題・相談）")
    .addTag("plans", "Plan（明日やること）")
    .addTag("comments", "コメント")
    .addTag("customers", "顧客マスタ")
    .addTag("salespersons", "営業マスタ")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // サーバー起動
  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger UI is available at: http://localhost:${port}/api/docs`);
}

bootstrap();
