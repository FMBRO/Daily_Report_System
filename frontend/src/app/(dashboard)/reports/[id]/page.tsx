"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner, LoadingPage } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { getReport } from "@/lib/services/reports";
import { createComment } from "@/lib/services/comments";
import type { DailyReport, Problem, Plan, Comment, ProblemPriority } from "@/types/report";
import type { ApiError } from "@/types/api";
import { PencilIcon, SendIcon } from "lucide-react";

function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return format(date, "yyyy年MM月dd日", { locale: ja });
}

function formatTime(timeString: string): string {
  if (!timeString) return "";
  // Handle HH:mm format
  if (timeString.length === 5) {
    return timeString;
  }
  // Handle ISO date string
  const date = new Date(timeString);
  return format(date, "HH:mm", { locale: ja });
}

function formatDateTime(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  return format(date, "yyyy/MM/dd HH:mm", { locale: ja });
}

interface StatusBadgeProps {
  status: "draft" | "submitted";
}

function StatusBadge({ status }: StatusBadgeProps) {
  const variant = status === "submitted" ? "default" : "secondary";
  const label = status === "submitted" ? "提出済み" : "下書き";

  return (
    <Badge
      variant={variant}
      className={cn(
        status === "submitted"
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      )}
    >
      {label}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: ProblemPriority;
}

function PriorityBadge({ priority }: PriorityBadgeProps) {
  const priorityConfig: Record<ProblemPriority, { label: string; className: string }> = {
    high: {
      label: "高",
      className: "bg-red-100 text-red-800 border-red-200",
    },
    medium: {
      label: "中",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    low: {
      label: "低",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
  };

  const config = priorityConfig[priority];

  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

interface CommentSectionProps {
  comments: Comment[];
  targetType: "problem" | "plan";
  targetId: string;
  canComment: boolean;
  onCommentSubmitted: () => void;
}

function CommentSection({
  comments,
  targetType,
  targetId,
  canComment,
  onCommentSubmitted,
}: CommentSectionProps) {
  const toast = useToast();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.warning("コメントを入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createComment({
        targetType,
        targetId,
        content: content.trim(),
      });

      if (response.success) {
        toast.success("コメントを投稿しました");
        setContent("");
        onCommentSubmitted();
      }
    } catch (err) {
      const apiError = err as ApiError;
      toast.error("コメントの投稿に失敗しました", apiError.error?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <div className="text-sm font-medium text-muted-foreground mb-2">コメント</div>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">(コメントなし)</p>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{comment.author?.name || "不明"}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {canComment && (
        <div className="flex gap-2 mt-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="コメントを入力..."
            className="min-h-[60px]"
            disabled={isSubmitting}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="shrink-0"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

interface VisitCardProps {
  visit: {
    id: string;
    customer?: { name: string };
    visitTime: string;
    purpose: string;
    content: string;
    result?: string;
    nextAction?: string;
  };
}

function VisitCard({ visit }: VisitCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          {visit.visitTime && (
            <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
              {formatTime(visit.visitTime)}
            </span>
          )}
          <div className="flex-1 space-y-2">
            <div className="font-medium">{visit.customer?.name || "顧客不明"}</div>
            {visit.purpose && (
              <div className="text-sm">
                <span className="text-muted-foreground">目的: </span>
                {visit.purpose}
              </div>
            )}
            <div className="text-sm">
              <span className="text-muted-foreground">内容: </span>
              <span className="whitespace-pre-wrap">{visit.content}</span>
            </div>
            {visit.result && (
              <div className="text-sm">
                <span className="text-muted-foreground">結果: </span>
                <span className="whitespace-pre-wrap">{visit.result}</span>
              </div>
            )}
            {visit.nextAction && (
              <div className="text-sm">
                <span className="text-muted-foreground">次のアクション: </span>
                <span className="whitespace-pre-wrap">{visit.nextAction}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProblemCardProps {
  problem: Problem;
  canComment: boolean;
  onCommentSubmitted: () => void;
}

function ProblemCard({ problem, canComment, onCommentSubmitted }: ProblemCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <PriorityBadge priority={problem.priority} />
          <div className="flex-1">
            <p className="whitespace-pre-wrap">{problem.content}</p>
            <CommentSection
              comments={problem.comments || []}
              targetType="problem"
              targetId={problem.id}
              canComment={canComment}
              onCommentSubmitted={onCommentSubmitted}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PlanCardProps {
  plan: Plan;
  canComment: boolean;
  onCommentSubmitted: () => void;
}

function PlanCard({ plan, canComment, onCommentSubmitted }: PlanCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-2">
          <p className="whitespace-pre-wrap">{plan.content}</p>
          {plan.targetDate && (
            <div className="text-sm text-muted-foreground">
              目標日: {formatDateForDisplay(plan.targetDate)}
            </div>
          )}
          <CommentSection
            comments={plan.comments || []}
            targetType="plan"
            targetId={plan.id}
            canComment={canComment}
            onCommentSubmitted={onCommentSubmitted}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const reportId = params.id as string;

  const [report, setReport] = useState<DailyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getReport(reportId);
      if (response.success && response.data) {
        setReport(response.data);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error?.message || "日報の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleEdit = () => {
    router.push(`/reports/${reportId}/edit`);
  };

  const handleCommentSubmitted = () => {
    // Refetch the report to get updated comments
    fetchReport();
  };

  // Check if user can comment (manager or admin role)
  const canComment = user?.role === "manager" || user?.role === "admin";

  // Check if user can edit (own report and draft status)
  const canEdit =
    report?.status === "draft" &&
    (user?.id === report?.salespersonId || user?.role === "admin");

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">日報詳細</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/reports")}
            >
              日報一覧に戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">日報詳細</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">日報が見つかりません</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/reports")}
            >
              日報一覧に戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">日報詳細</h1>
        {canEdit && (
          <Button onClick={handleEdit}>
            <PencilIcon className="mr-2 h-4 w-4" />
            編集
          </Button>
        )}
      </div>

      {/* Report Basic Info */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">報告日:</span>
              <span className="font-medium">
                {formatDateForDisplay(report.reportDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">担当者:</span>
              <span className="font-medium">
                {report.salesperson?.name || "不明"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">ステータス:</span>
              <StatusBadge status={report.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visits Section */}
      <Card>
        <CardHeader>
          <CardTitle>訪問記録</CardTitle>
        </CardHeader>
        <CardContent>
          {!report.visits || report.visits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              訪問記録がありません
            </p>
          ) : (
            <div className="space-y-4">
              {report.visits.map((visit) => (
                <VisitCard key={visit.id} visit={visit} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Problems Section */}
      <Card>
        <CardHeader>
          <CardTitle>Problem</CardTitle>
        </CardHeader>
        <CardContent>
          {!report.problems || report.problems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Problemがありません
            </p>
          ) : (
            <div className="space-y-4">
              {report.problems.map((problem) => (
                <ProblemCard
                  key={problem.id}
                  problem={problem}
                  canComment={canComment}
                  onCommentSubmitted={handleCommentSubmitted}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans Section */}
      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {!report.plans || report.plans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Planがありません
            </p>
          ) : (
            <div className="space-y-4">
              {report.plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  canComment={canComment}
                  onCommentSubmitted={handleCommentSubmitted}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex justify-start pb-8">
        <Button variant="outline" onClick={() => router.push("/reports")}>
          日報一覧に戻る
        </Button>
      </div>
    </div>
  );
}
