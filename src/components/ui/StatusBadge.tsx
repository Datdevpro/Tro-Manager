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
  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";

  switch (status) {
    // Room Status
    case "AVAILABLE":
      label = "Phòng trống";
      colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "OCCUPIED":
      label = "Đang thuê";
      colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "MAINTENANCE":
      label = "Đang sửa chữa";
      colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
      break;

    // Contract Status
    case "ACTIVE":
      label = "Đang hiệu lực";
      colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "EXPIRED":
      label = "Đã hết hạn";
      colorClasses = "bg-slate-100 text-slate-600 border-slate-200";
      break;
    case "TERMINATED":
      label = "Đã thanh lý";
      colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
      break;
    case "PENDING":
      label = "Chờ ký kết";
      colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
      break;

    // Invoice Status
    case "PAID":
      label = "Đã thanh toán";
      colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "UNPAID":
      label = "Chưa thanh toán";
      colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "OVERDUE":
      label = "Quá hạn";
      colorClasses = "bg-rose-50 text-rose-700 border-rose-200 font-semibold";
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
