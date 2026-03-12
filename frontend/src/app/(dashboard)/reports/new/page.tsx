"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { reportSchema, type ReportFormData } from "@/lib/validations/report";
import { createReport } from "@/lib/services/reports";
import { getCustomers } from "@/lib/services/customers";
import type { Customer } from "@/types/customer";
import type { ApiError } from "@/types/api";
import type { ProblemPriority } from "@/types/report";
import {
  CalendarIcon,
  PlusIcon,
  XIcon,
  CheckIcon,
  ChevronsUpDownIcon,
} from "lucide-react";

function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return format(date, "yyyy/MM/dd", { locale: ja });
}

function formatDateForApi(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

const priorityOptions: { value: ProblemPriority; label: string }[] = [
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

interface CustomerComboboxProps {
  value: string;
  onSelect: (value: string) => void;
  customers: Customer[];
  isLoading: boolean;
  error?: string;
}

function CustomerCombobox({
  value,
  onSelect,
  customers,
  isLoading,
  error,
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.address?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  const selectedCustomer = customers.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              error && "border-destructive"
            )}
          >
            {isLoading ? (
              "読み込み中..."
            ) : selectedCustomer ? (
              selectedCustomer.name
            ) : (
              "顧客を選択..."
            )}
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="顧客を検索..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>顧客が見つかりません</CommandEmpty>
            <CommandGroup>
              {filteredCustomers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={(currentValue) => {
                    onSelect(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  data-checked={value === customer.id}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === customer.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{customer.name}</span>
                    {customer.address && (
                      <span className="text-xs text-muted-foreground">
                        {customer.address}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function NewReportPage() {
  const router = useRouter();
  const toast = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportDate: formatDateForApi(new Date()),
      visits: [],
      problems: [],
      plans: [],
    },
  });

  const {
    fields: visitFields,
    append: appendVisit,
    remove: removeVisit,
  } = useFieldArray({
    control,
    name: "visits",
  });

  const {
    fields: problemFields,
    append: appendProblem,
    remove: removeProblem,
  } = useFieldArray({
    control,
    name: "problems",
  });

  const {
    fields: planFields,
    append: appendPlan,
    remove: removePlan,
  } = useFieldArray({
    control,
    name: "plans",
  });

  const reportDate = watch("reportDate");

  const fetchCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      const response = await getCustomers({ isActive: true, limit: 100 });
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (err) {
      const apiError = err as ApiError;
      toast.error("顧客データの取得に失敗しました", apiError.error?.message);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddVisit = () => {
    appendVisit({
      customerId: "",
      visitTime: "",
      purpose: "",
      content: "",
      result: "",
      nextAction: "",
    });
  };

  const handleAddProblem = () => {
    appendProblem({
      priority: "medium",
      content: "",
    });
  };

  const handleAddPlan = () => {
    appendPlan({
      content: "",
      targetDate: "",
    });
  };

  const onSubmit = async (data: ReportFormData, status: "draft" | "submitted") => {
    setIsSubmitting(true);

    try {
      const requestData = {
        reportDate: data.reportDate,
        status,
        visits: data.visits.map((v) => ({
          customerId: v.customerId,
          visitTime: v.visitTime || "",
          purpose: v.purpose || "",
          content: v.content,
          result: v.result,
          nextAction: v.nextAction,
        })),
        problems: data.problems.map((p) => ({
          priority: p.priority,
          content: p.content,
        })),
        plans: data.plans.map((p) => ({
          content: p.content,
          targetDate: p.targetDate,
        })),
      };

      const response = await createReport(requestData);

      if (response.success) {
        const message = status === "draft" ? "日報を下書き保存しました" : "日報を提出しました";
        toast.success(message);
        router.push("/reports");
      }
    } catch (err) {
      const apiError = err as ApiError;
      toast.error("日報の保存に失敗しました", apiError.error?.message);
    } finally {
      setIsSubmitting(false);
      setIsSubmitDialogOpen(false);
    }
  };

  const handleSaveDraft = handleSubmit((data) => onSubmit(data, "draft"));

  const handleSubmitReport = handleSubmit(() => {
    setIsSubmitDialogOpen(true);
  });

  const confirmSubmit = () => {
    handleSubmit((data) => onSubmit(data, "submitted"))();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">日報作成</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : "下書き保存"}
          </Button>
          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogTrigger
              render={
                <Button onClick={handleSubmitReport} disabled={isSubmitting}>
                  {isSubmitting ? <LoadingSpinner size="sm" /> : "提出"}
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>日報を提出しますか？</DialogTitle>
                <DialogDescription>
                  提出後は内容を編集できなくなります。よろしいですか？
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline">キャンセル</Button>}
                />
                <Button onClick={confirmSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <LoadingSpinner size="sm" /> : "提出する"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Report Date */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">報告日:</label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !reportDate && "text-muted-foreground",
                      errors.reportDate && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reportDate ? formatDateForDisplay(reportDate) : "日付を選択"}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reportDate ? new Date(reportDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setValue("reportDate", formatDateForApi(date));
                    }
                    setDatePickerOpen(false);
                  }}
                  locale={ja}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.reportDate && (
              <span className="text-sm text-destructive">
                {errors.reportDate.message}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visits Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>訪問記録</CardTitle>
            <Button size="sm" onClick={handleAddVisit}>
              <PlusIcon className="mr-1 h-4 w-4" />
              訪問を追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {visitFields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              訪問記録がありません。「訪問を追加」をクリックして追加してください。
            </p>
          ) : (
            <div className="space-y-4">
              {visitFields.map((field, index) => (
                <Card key={field.id} className="relative">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeVisit(index)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">顧客 *</label>
                        <Controller
                          control={control}
                          name={`visits.${index}.customerId`}
                          render={({ field: controllerField }) => (
                            <CustomerCombobox
                              value={controllerField.value}
                              onSelect={controllerField.onChange}
                              customers={customers}
                              isLoading={isLoadingCustomers}
                              error={errors.visits?.[index]?.customerId?.message}
                            />
                          )}
                        />
                        {errors.visits?.[index]?.customerId && (
                          <span className="text-sm text-destructive">
                            {errors.visits[index]?.customerId?.message}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">訪問時刻</label>
                        <Input
                          type="time"
                          {...register(`visits.${index}.visitTime`)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">目的</label>
                      <Input
                        placeholder="例: 定期訪問、新商品提案"
                        {...register(`visits.${index}.purpose`)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">内容 *</label>
                      <Textarea
                        placeholder="訪問内容を入力してください"
                        {...register(`visits.${index}.content`)}
                        className={cn(
                          errors.visits?.[index]?.content && "border-destructive"
                        )}
                      />
                      {errors.visits?.[index]?.content && (
                        <span className="text-sm text-destructive">
                          {errors.visits[index]?.content?.message}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">結果</label>
                      <Textarea
                        placeholder="例: 次回見積提出予定"
                        {...register(`visits.${index}.result`)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Problems Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Problem</CardTitle>
            <Button size="sm" onClick={handleAddProblem}>
              <PlusIcon className="mr-1 h-4 w-4" />
              Problemを追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {problemFields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Problemがありません。「Problemを追加」をクリックして追加してください。
            </p>
          ) : (
            <div className="space-y-4">
              {problemFields.map((field, index) => (
                <Card key={field.id} className="relative">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeProblem(index)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">優先度 *</label>
                      <Controller
                        control={control}
                        name={`problems.${index}.priority`}
                        render={({ field: controllerField }) => (
                          <Select
                            value={controllerField.value}
                            onValueChange={controllerField.onChange}
                          >
                            <SelectTrigger
                              className={cn(
                                "w-[120px]",
                                errors.problems?.[index]?.priority &&
                                  "border-destructive"
                              )}
                            >
                              <SelectValue placeholder="選択..." />
                            </SelectTrigger>
                            <SelectContent>
                              {priorityOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.problems?.[index]?.priority && (
                        <span className="text-sm text-destructive">
                          {errors.problems[index]?.priority?.message}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">内容 *</label>
                      <Textarea
                        placeholder="問題・課題の内容を入力してください"
                        {...register(`problems.${index}.content`)}
                        className={cn(
                          errors.problems?.[index]?.content && "border-destructive"
                        )}
                      />
                      {errors.problems?.[index]?.content && (
                        <span className="text-sm text-destructive">
                          {errors.problems[index]?.content?.message}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plan</CardTitle>
            <Button size="sm" onClick={handleAddPlan}>
              <PlusIcon className="mr-1 h-4 w-4" />
              Planを追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {planFields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Planがありません。「Planを追加」をクリックして追加してください。
            </p>
          ) : (
            <div className="space-y-4">
              {planFields.map((field, index) => (
                <Card key={field.id} className="relative">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-2 right-2"
                    onClick={() => removePlan(index)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">内容 *</label>
                      <Textarea
                        placeholder="計画の内容を入力してください"
                        {...register(`plans.${index}.content`)}
                        className={cn(
                          errors.plans?.[index]?.content && "border-destructive"
                        )}
                      />
                      {errors.plans?.[index]?.content && (
                        <span className="text-sm text-destructive">
                          {errors.plans[index]?.content?.message}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" onClick={() => router.push("/reports")}>
          キャンセル
        </Button>
        <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
          {isSubmitting ? <LoadingSpinner size="sm" /> : "下書き保存"}
        </Button>
        <Button onClick={handleSubmitReport} disabled={isSubmitting}>
          {isSubmitting ? <LoadingSpinner size="sm" /> : "提出"}
        </Button>
      </div>
    </div>
  );
}
