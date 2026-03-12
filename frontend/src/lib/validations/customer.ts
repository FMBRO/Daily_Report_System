import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "顧客名を入力してください"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
