import { z } from "zod";

/**
 * ログインフォームのバリデーションスキーマ
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "メールアドレスを入力してください" })
    .email({ message: "有効なメールアドレスを入力してください" }),
  password: z
    .string()
    .min(1, { message: "パスワードを入力してください" }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
