import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { PrismaModule } from "./prisma";
import { AuthModule } from "./auth";
import { SalespersonsModule } from "./salespersons";
import { CustomersModule } from "./customers";
import { ReportsModule } from "./reports";
import { VisitsModule } from "./visits";
import { ProblemsModule } from "./problems";
import { PlansModule } from "./plans";
import { CommentsModule } from "./comments";
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
    // 営業担当者モジュール
    SalespersonsModule,
    // 顧客モジュール
    CustomersModule,
    // 日報モジュール
    ReportsModule,
    // 訪問記録モジュール
    VisitsModule,
    // 課題・相談モジュール
    ProblemsModule,
    // 計画モジュール
    PlansModule,
    // コメントモジュール
    CommentsModule,
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
