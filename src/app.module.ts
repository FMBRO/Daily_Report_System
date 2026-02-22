import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { PrismaModule } from "./prisma";
import { AuthModule } from "./auth";
import { GlobalExceptionFilter } from "./common/filters";
import { TransformResponseInterceptor } from "./common/interceptors";

@Module({
  imports: [
    // 環境変数の読み込み
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    // Prismaモジュール（グローバル）
    PrismaModule,
    // 認証モジュール
    AuthModule,
    // 機能モジュール（今後追加）
    // ReportsModule,
    // SalespersonsModule,
    // CustomersModule,
  ],
  controllers: [],
  providers: [
    // グローバル例外フィルター
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // グローバルレスポンスインターセプター
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class AppModule {}
