"use client";

import { useState, useCallback, useMemo } from "react";

interface PaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

interface PaginationState {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface UsePaginationReturn extends PaginationState {
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTotalItems: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;
  offset: number;
}

export function usePagination(options: PaginationOptions = {}): UsePaginationReturn {
  const { initialPage = 1, initialLimit = 20 } = options;

  const [state, setState] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    totalItems: 0,
    totalPages: 0,
  });

  const setPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      page: Math.max(1, Math.min(page, prev.totalPages || 1)),
    }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setState((prev) => {
      const newTotalPages = Math.ceil(prev.totalItems / limit) || 1;
      return {
        ...prev,
        limit,
        totalPages: newTotalPages,
        page: Math.min(prev.page, newTotalPages),
      };
    });
  }, []);

  const setTotalItems = useCallback((totalItems: number) => {
    setState((prev) => {
      const newTotalPages = Math.ceil(totalItems / prev.limit) || 1;
      return {
        ...prev,
        totalItems,
        totalPages: newTotalPages,
        page: Math.min(prev.page, newTotalPages),
      };
    });
  }, []);

  const nextPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: Math.min(prev.page + 1, prev.totalPages),
    }));
  }, []);

  const prevPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: Math.max(prev.page - 1, 1),
    }));
  }, []);

  const goToFirstPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: 1,
    }));
  }, []);

  const goToLastPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: prev.totalPages,
    }));
  }, []);

  const canNextPage = useMemo(() => state.page < state.totalPages, [state.page, state.totalPages]);

  const canPrevPage = useMemo(() => state.page > 1, [state.page]);

  const offset = useMemo(() => (state.page - 1) * state.limit, [state.page, state.limit]);

  return {
    ...state,
    setPage,
    setLimit,
    setTotalItems,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    canNextPage,
    canPrevPage,
    offset,
  };
}
