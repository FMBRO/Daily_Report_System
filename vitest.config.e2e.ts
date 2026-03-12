import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.e2e-spec.ts"],
    testTimeout: 30000, // E2Eテストは時間がかかる可能性があるため30秒に設定
    hookTimeout: 30000,
  },
});
