"use client";

import { toast } from "sonner";
import { useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export function useToast() {
  const showToast = useCallback((type: ToastType, options: ToastOptions) => {
    const { title, description, duration = 5000 } = options;

    switch (type) {
      case "success":
        toast.success(title, {
          description,
          duration,
        });
        break;
      case "error":
        toast.error(title, {
          description,
          duration,
        });
        break;
      case "warning":
        toast.warning(title, {
          description,
          duration,
        });
        break;
      case "info":
      default:
        toast.info(title, {
          description,
          duration,
        });
        break;
    }
  }, []);

  const success = useCallback(
    (title: string, description?: string) => {
      showToast("success", { title, description });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      showToast("error", { title, description });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      showToast("warning", { title, description });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      showToast("info", { title, description });
    },
    [showToast]
  );

  const dismiss = useCallback(() => {
    toast.dismiss();
  }, []);

  return {
    showToast,
    success,
    error,
    warning,
    info,
    dismiss,
  };
}
