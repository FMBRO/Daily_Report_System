import { z } from "zod";

export const visitSchema = z.object({
  customerId: z.string().min(1, "顧客を選択してください"),
  visitTime: z.string().optional(),
  purpose: z.string().optional(),
  content: z.string().min(1, "訪問内容を入力してください"),
  result: z.string().optional(),
  nextAction: z.string().optional(),
});

export const problemSchema = z.object({
  priority: z.enum(["high", "medium", "low"], { message: "優先度を選択してください" }),
  content: z.string().min(1, "内容を入力してください"),
});

export const planSchema = z.object({
  content: z.string().min(1, "内容を入力してください"),
  targetDate: z.string().optional(),
});

export const reportSchema = z.object({
  reportDate: z.string().min(1, "報告日を選択してください"),
  visits: z.array(visitSchema),
  problems: z.array(problemSchema),
  plans: z.array(planSchema),
});

export type VisitFormData = z.infer<typeof visitSchema>;
export type ProblemFormData = z.infer<typeof problemSchema>;
export type PlanFormData = z.infer<typeof planSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
