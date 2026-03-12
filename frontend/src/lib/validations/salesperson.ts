import { z } from "zod";

/**
 * 営業担当者作成フォームスキーマ
 */
export const createSalespersonSchema = z.object({
  name: z.string().min(1, "氏名を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  role: z.enum(["sales", "manager", "admin"], "役割を選択してください"),
  managerId: z.string().nullable().optional(),
});

/**
 * 営業担当者更新フォームスキーマ
 */
export const updateSalespersonSchema = z.object({
  name: z.string().min(1, "氏名を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 8,
      "パスワードは8文字以上で入力してください"
    ),
  role: z.enum(["sales", "manager", "admin"], "役割を選択してください"),
  managerId: z.string().nullable().optional(),
});

export type CreateSalespersonFormData = z.infer<typeof createSalespersonSchema>;
export type UpdateSalespersonFormData = z.infer<typeof updateSalespersonSchema>;
