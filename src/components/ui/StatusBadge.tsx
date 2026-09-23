import React from "react";
import { cn } from "@/lib/utils";

type StatusType =
  | "AVAILABLE"
  | "OCCUPIED"
  | "MAINTENANCE"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"
  | "PENDING"
  | "UNPAID"
  | "PAID"
  | "OVERDUE"
  | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let label = status;
  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

  switch (status) {
    // Room Status
    case "AVAILABLE":
      label = "Phòng trống";
      colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      break;
    case "OCCUPIED":
      label = "Đang thuê";
      colorClasses = "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
      break;
    case "MAINTENANCE":
      label = "Đang sửa chữa";
      colorClasses = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
      break;

    // Contract Status
    case "ACTIVE":
      label = "Đang hiệu lực";
      colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      break;
    case "EXPIRED":
      label = "Đã hết hạn";
      colorClasses = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      break;
    case "TERMINATED":
      label = "Đã thanh lý";
      colorClasses = "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
      break;
    case "PENDING":
      label = "Chờ ký kết";
      colorClasses = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
      break;

    // Invoice Status
    case "PAID":
      label = "Đã thanh toán";
      colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      break;
    case "UNPAID":
      label = "Chưa thanh toán";
      colorClasses = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
      break;
    case "OVERDUE":
      label = "Quá hạn";
      colorClasses = "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 font-semibold";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs transition-colors",
        colorClasses,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {label}
    </span>
  );
}
