import { PrismaClient, Role, ReportStatus, Priority, CommentTargetType } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

/**
 * シードデータ投入スクリプト
 * テスト仕様書 3.1, 3.2 に基づくテストデータを作成
 */
async function main() {
  console.log("🌱 シードデータの投入を開始します...");

  // パスワードのハッシュ化（全ユーザー共通: "password123"）
  const hashedPassword = await bcrypt.hash("password123", 10);

  // ============================================================
  // 営業マスタデータ
  // ============================================================
  console.log("👤 営業担当者データを作成中...");

  // 管理者を最初に作成
  const admin = await prisma.salesperson.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "管理者",
      email: "admin@example.com",
      password: hashedPassword,
      role: Role.admin,
      isActive: true,
    },
  });
  console.log(`  ✅ 管理者: ${admin.name} (${admin.email})`);

  // 部長（マネージャー）を作成
  const manager = await prisma.salesperson.upsert({
    where: { email: "suzuki@example.com" },
    update: {},
    create: {
      name: "鈴木部長",
      email: "suzuki@example.com",
      password: hashedPassword,
      role: Role.manager,
      isActive: true,
    },
  });
  console.log(`  ✅ マネージャー: ${manager.name} (${manager.email})`);

  // 営業担当者を作成（上長: 鈴木部長）
  const tanaka = await prisma.salesperson.upsert({
    where: { email: "tanaka@example.com" },
    update: {},
    create: {
      name: "田中太郎",
      email: "tanaka@example.com",
      password: hashedPassword,
      role: Role.sales,
      managerId: manager.id,
      isActive: true,
    },
  });
  console.log(`  ✅ 営業: ${tanaka.name} (${tanaka.email})`);

  const sato = await prisma.salesperson.upsert({
    where: { email: "sato@example.com" },
    update: {},
    create: {
      name: "佐藤花子",
      email: "sato@example.com",
      password: hashedPassword,
      role: Role.sales,
      managerId: manager.id,
      isActive: true,
    },
  });
  console.log(`  ✅ 営業: ${sato.name} (${sato.email})`);

  // ============================================================
  // 顧客マスタデータ
  // ============================================================
  console.log("🏢 顧客データを作成中...");

  const customerABC = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      customerName: "株式会社ABC",
      address: "東京都千代田区丸の内1-1-1",
      phone: "03-1234-5678",
      industry: "製造業",
      isActive: true,
    },
  });
  console.log(`  ✅ 顧客: ${customerABC.customerName} (${customerABC.industry})`);

  const customerDEF = await prisma.customer.upsert({
    where: { id: 2 },
    update: {},
    create: {
      customerName: "DEF商事",
      address: "大阪府大阪市中央区本町2-2-2",
      phone: "06-9876-5432",
      industry: "卸売業",
      isActive: true,
    },
  });
  console.log(`  ✅ 顧客: ${customerDEF.customerName} (${customerDEF.industry})`);

  const customerGHI = await prisma.customer.upsert({
    where: { id: 3 },
    update: {},
    create: {
      customerName: "GHIテクノロジー",
      address: "福岡県福岡市博多区博多駅前3-3-3",
      phone: "092-1111-2222",
      industry: "IT",
      isActive: true,
    },
  });
  console.log(`  ✅ 顧客: ${customerGHI.customerName} (${customerGHI.industry})`);

  // ============================================================
  // サンプル日報データ（オプション）
  // ============================================================
  console.log("📝 サンプル日報データを作成中...");

  // 田中太郎の日報
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const report = await prisma.dailyReport.upsert({
    where: {
      salespersonId_reportDate: {
        salespersonId: tanaka.id,
        reportDate: today,
      },
    },
    update: {},
    create: {
      salespersonId: tanaka.id,
      reportDate: today,
      status: ReportStatus.submitted,
    },
  });
  console.log(`  ✅ 日報: ${tanaka.name} - ${today.toISOString().split("T")[0]}`);

  // 訪問記録
  const _visit = await prisma.visit.create({
    data: {
      reportId: report.id,
      customerId: customerABC.id,
      visitTime: new Date("1970-01-01T10:00:00"),
      visitPurpose: "新製品提案",
      visitContent:
        "新製品Xについて説明を行い、デモを実施しました。担当者様から好感触を得られました。",
      result: "次回見積提出予定",
    },
  });
  console.log(`  ✅ 訪問: ${customerABC.customerName}`);

  // 課題・相談
  const problem = await prisma.problem.create({
    data: {
      reportId: report.id,
      content: "競合他社が価格攻勢をかけており、価格面での相談が必要です。",
      priority: Priority.high,
    },
  });
  console.log(`  ✅ 課題: 優先度${problem.priority}`);

  // 明日やること
  const _plan = await prisma.plan.create({
    data: {
      reportId: report.id,
      content: "見積書を作成し、ABC社に提出する。",
    },
  });
  console.log(`  ✅ 計画: 作成完了`);

  // コメント
  const _comment = await prisma.comment.create({
    data: {
      targetType: CommentTargetType.problem,
      targetId: problem.id,
      problemId: problem.id,
      commenterId: manager.id,
      content: "了解しました。来週の会議で価格戦略について議論しましょう。",
    },
  });
  console.log(`  ✅ コメント: ${manager.name}からのフィードバック`);

  console.log("\n✨ シードデータの投入が完了しました！");
  console.log("\n📊 作成されたデータ:");
  console.log(`  - 営業担当者: 4名`);
  console.log(`  - 顧客: 3社`);
  console.log(`  - 日報: 1件（訪問1件、課題1件、計画1件、コメント1件）`);
  console.log("\n🔑 ログイン情報（全ユーザー共通）:");
  console.log(`  - パスワード: password123`);
}

main()
  .catch((e) => {
    console.error("❌ シードデータの投入に失敗しました:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
