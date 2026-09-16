import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "--/--/----";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "--/--/----";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "--/--/---- --:--";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "--/--/---- --:--";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatMonthYear(monthStr: string): string {
  // expects "YYYY-MM"
  if (!monthStr || !monthStr.includes("-")) return monthStr;
  const [year, month] = monthStr.split("-");
  return `Tháng ${parseInt(month, 10)}/${year}`;
}

export function calculateUtilityCost(
  oldVal: number,
  newVal: number,
  unitPrice: number
): { usage: number; cost: number } {
  const usage = Math.max(0, newVal - oldVal);
  const cost = usage * unitPrice;
  return { usage, cost };
}

export function calculateInvoiceTotal(params: {
  roomFee: number;
  electricFee: number;
  waterFee: number;
  serviceFee: number;
  otherFee?: number;
  previousDebt?: number;
  discount?: number;
}): number {
  const {
    roomFee = 0,
    electricFee = 0,
    waterFee = 0,
    serviceFee = 0,
    otherFee = 0,
    previousDebt = 0,
    discount = 0,
  } = params;

  const total =
    roomFee +
    electricFee +
    waterFee +
    serviceFee +
    otherFee +
    previousDebt -
    discount;

  return Math.max(0, total);
}
