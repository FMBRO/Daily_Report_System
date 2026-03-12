"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pagination } from "@/components/Pagination";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { usePagination } from "@/hooks/usePagination";
import { getReports } from "@/lib/services/reports";
import { cn } from "@/lib/utils";
import type { DailyReportSummary, ReportStatus } from "@/types/report";
import type { ApiError } from "@/types/api";
import { CalendarIcon, PlusIcon } from "lucide-react";

type StatusFilter = "all" | ReportStatus;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function StatusBadge({ status }: { status: ReportStatus }) {
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

interface DatePickerProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder: string;
}

function DatePicker({ date, onSelect, placeholder }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? formatDate(formatDateForApi(date)) : placeholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            onSelect(newDate);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

interface ReportCardProps {
  report: DailyReportSummary;
  onClick: () => void;
}

function ReportCard({ report, onClick }: ReportCardProps) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="text-lg font-semibold">
              {formatDate(report.reportDate)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {report.salesperson?.name || "不明"}
              </span>
              <StatusBadge status={report.status} />
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>訪問: {report.visitCount}</span>
              <span>問題: {report.problemCount}</span>
              <span>計画: {report.planCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const pagination = usePagination({ initialPage: 1, initialLimit: 10 });

  const [reports, setReports] = useState<DailyReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const { page, limit, setTotalItems } = pagination;

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit,
        status: statusFilter !== "all" ? statusFilter : undefined,
        dateFrom: dateFrom ? formatDateForApi(dateFrom) : undefined,
        dateTo: dateTo ? formatDateForApi(dateTo) : undefined,
      };

      const response = await getReports(params);

      if (response.success && response.data) {
        setReports(response.data);
        if (response.pagination) {
          setTotalItems(response.pagination.total);
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error?.message || "日報の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, setTotalItems, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleReportClick = (reportId: string) => {
    router.push(`/reports/${reportId}`);
  };

  const handleNewReport = () => {
    router.push("/reports/new");
  };

  const handleStatusChange = (value: string | null) => {
    if (value) {
      setStatusFilter(value as StatusFilter);
      pagination.setPage(1);
    }
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    pagination.setPage(1);
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    pagination.setPage(1);
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    pagination.setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">日報一覧</h1>
        <Button onClick={handleNewReport}>
          <PlusIcon className="mr-2 h-4 w-4" />
          新規作成
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">期間:</span>
              <DatePicker
                date={dateFrom}
                onSelect={handleDateFromChange}
                placeholder="開始日"
              />
              <span className="text-muted-foreground">~</span>
              <DatePicker
                date={dateTo}
                onSelect={handleDateToChange}
                placeholder="終了日"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">ステータス:</span>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="全て" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="draft">下書き</SelectItem>
                  <SelectItem value="submitted">提出済み</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(statusFilter !== "all" || dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                フィルターをクリア
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" label="日報を読み込み中..." />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchReports()}
            >
              再試行
            </Button>
          </CardContent>
        </Card>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">日報が見つかりませんでした。</p>
            <Button className="mt-4" onClick={handleNewReport}>
              <PlusIcon className="mr-2 h-4 w-4" />
              新しい日報を作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={() => handleReportClick(report.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && reports.length > 0 && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
          />
        </div>
      )}
    </div>
  );
}
