"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/Pagination";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import { DeleteConfirmDialog } from "@/components/customers/DeleteConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/hooks/useToast";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/lib/services/customers";
import type { Customer } from "@/types/customer";
import type { CustomerFormData } from "@/lib/validations/customer";
import type { ApiError } from "@/types/api";

// 業種のリスト（サンプル）
const INDUSTRIES = [
  { value: "all", label: "全て" },
  { value: "製造業", label: "製造業" },
  { value: "卸売業", label: "卸売業" },
  { value: "小売業", label: "小売業" },
  { value: "サービス業", label: "サービス業" },
  { value: "IT", label: "IT" },
  { value: "金融", label: "金融" },
  { value: "不動産", label: "不動産" },
  { value: "建設", label: "建設" },
  { value: "その他", label: "その他" },
];

export default function CustomersPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { success, error: showError } = useToast();
  const pagination = usePagination({ initialLimit: 20 });
  const { page, limit, totalPages, setPage, setTotalItems } = pagination;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");

  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAuthLoading && user && user.role !== "admin") {
      router.push("/reports");
    }
  }, [user, isAuthLoading, router]);

  const fetchCustomers = useCallback(async (pageNum: number, limitNum: number, search: string) => {
    try {
      setIsLoading(true);
      const response = await getCustomers({
        page: pageNum,
        limit: limitNum,
        search: search || undefined,
      });

      if (response.success && response.data) {
        setCustomers(response.data);
        if (response.pagination) {
          setTotalItems(response.pagination.total);
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      showError("エラー", apiError.error?.message || "顧客一覧の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [setTotalItems, showError]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchCustomers(page, limit, searchKeyword);
    }
  }, [user?.role, page, limit, searchKeyword, fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers(1, limit, searchKeyword);
  };

  const handleOpenCreateDialog = () => {
    setSelectedCustomer(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormDialogOpen(true);
  };

  const handleOpenDeleteDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: CustomerFormData) => {
    try {
      setIsSubmitting(true);

      if (selectedCustomer) {
        // Update existing customer
        await updateCustomer(selectedCustomer.id, data);
        success("更新完了", "顧客情報を更新しました");
      } else {
        // Create new customer
        await createCustomer(data);
        success("登録完了", "新しい顧客を登録しました");
      }

      setIsFormDialogOpen(false);
      fetchCustomers(page, limit, searchKeyword);
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        "エラー",
        apiError.error?.message || (selectedCustomer ? "顧客の更新に失敗しました" : "顧客の登録に失敗しました")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;

    try {
      setIsSubmitting(true);
      await deleteCustomer(selectedCustomer.id);
      success("削除完了", "顧客を削除しました");
      setIsDeleteDialogOpen(false);
      fetchCustomers(page, limit, searchKeyword);
    } catch (err) {
      const apiError = err as ApiError;
      showError("エラー", apiError.error?.message || "顧客の削除に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter customers by industry (client-side filtering for now)
  const filteredCustomers = industryFilter === "all"
    ? customers
    : customers.filter((c) => c.notes?.includes(industryFilter));

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Block non-admin users
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">顧客管理</h1>
        <Button onClick={handleOpenCreateDialog}>
          <PlusIcon className="mr-1" />
          新規登録
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="顧客名で検索..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="outline">
            検索
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">業種:</span>
          <Select value={industryFilter} onValueChange={(value) => value && setIndustryFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry.value} value={industry.value}>
                  {industry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customer table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          顧客が見つかりませんでした
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>顧客名</TableHead>
                <TableHead>住所</TableHead>
                <TableHead>電話番号</TableHead>
                <TableHead>担当者</TableHead>
                <TableHead className="text-center">ステータス</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {customer.address || "-"}
                  </TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>{customer.contactPerson || "-"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={customer.isActive ? "default" : "secondary"}>
                      {customer.isActive ? "有効" : "無効"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenEditDialog(customer)}
                        title="編集"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenDeleteDialog(customer)}
                        title="削除"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Form Dialog */}
      <CustomerFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        customer={selectedCustomer}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        customerName={selectedCustomer?.name || ""}
        onConfirm={handleDeleteConfirm}
        isLoading={isSubmitting}
      />
    </div>
  );
}
