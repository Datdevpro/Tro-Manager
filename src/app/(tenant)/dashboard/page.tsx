"use client";

import React, { useEffect, useState } from "react";
import {
  Home,
  DoorOpen,
  FileText,
  Receipt,
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  MapPin,
  Calendar,
  Sparkles,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PaymentModal } from "@/components/tenant/PaymentModal";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

export default function TenantDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tenant/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      toast.error("Lỗi khi tải cổng cư dân");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const markNotificationRead = async (notifId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notifId}/read`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Đã đánh dấu đã đọc");
        fetchDashboard();
      }
    } catch {
      toast.error("Lỗi xử lý");
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl md:col-span-2" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { tenant, currentRoom, currentContract, currentInvoice, recentNotifications } = data;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Cổng Thông Tin Cư Dân
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {tenant.user.fullName}!
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
            Theo dõi phòng ở, thời hạn hợp đồng, lịch đóng tiền nhà và cập nhật các thông báo mới nhất từ Ban Quản Lý.
          </p>
        </div>

        {currentRoom && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0 min-w-[160px]">
            <span className="text-[11px] uppercase tracking-wider text-emerald-200 block">
              Phòng đang ở
            </span>
            <span className="text-3xl font-extrabold block text-white mt-0.5">
              {currentRoom.roomNumber}
            </span>
            <span className="text-xs text-emerald-100 block truncate max-w-[150px]">
              {currentRoom.property?.name}
            </span>
          </div>
        )}
      </div>

      {/* Row 1: Current Room & Current Contract */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Room Details */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Phòng thuê hiện tại</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Thông tin phòng & tiện ích</p>
                </div>
              </div>
              {currentRoom && <StatusBadge status={currentRoom.status} />}
            </div>

            {currentRoom ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Tòa nhà / Khu trọ:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{currentRoom.property?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Địa chỉ:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-right max-w-[240px] truncate">
                    {currentRoom.property?.address}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Tiền phòng hằng tháng:</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                    {formatCurrency(currentRoom.rentPrice)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Tiền cọc giữ chỗ:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(currentRoom.deposit)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Ngày bắt đầu vào ở:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(tenant.startDate)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 italic text-xs py-4">Bạn chưa được gán phòng nào.</p>
            )}
          </div>
        </div>

        {/* Current Contract */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Hợp đồng thuê phòng</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Thời hạn cam kết & trạng thái</p>
                </div>
              </div>
              {currentContract && <StatusBadge status={currentContract.status} />}
            </div>

            {currentContract ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Ngày bắt đầu hợp đồng:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(currentContract.startDate)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Ngày hết hạn hợp đồng:</span>
                  <span className="font-bold text-rose-700 dark:text-rose-400">
                    {formatDate(currentContract.endDate)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Kỳ hạn thanh toán:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {currentContract.paymentCycle} tháng / lần
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-slate-600 dark:text-slate-400 block mb-1">Ghi chú điều khoản:</span>
                  <p className="text-slate-700 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 italic">
                    {currentContract.terms || "Hợp đồng tuân thủ nội quy chung của khu trọ."}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 italic text-xs py-4">Chưa có hợp đồng nào có hiệu lực.</p>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-right">
            <Link
              href="/contract"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-1"
            >
              Xem văn bản hợp đồng đầy đủ <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 2: Current Invoice & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Invoice Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Hóa đơn kỳ gần nhất</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {currentInvoice ? `Kỳ ${formatMonthYear(currentInvoice.month)}` : "Chưa có hóa đơn"}
                  </p>
                </div>
              </div>
              {currentInvoice && <StatusBadge status={currentInvoice.status} />}
            </div>

            {currentInvoice ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Tiền phòng:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(currentInvoice.roomFee)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Tiền điện:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(currentInvoice.electricFee)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Tiền nước:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(currentInvoice.waterFee)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Phí dịch vụ:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(currentInvoice.serviceFee)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white">Tổng tiền:</span>
                  <span className="font-extrabold text-indigo-700 dark:text-indigo-400 text-sm">
                    {formatCurrency(currentInvoice.total)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                  <span>Hạn thanh toán: {formatDate(currentInvoice.dueDate)}</span>
                  <span className="font-bold text-rose-700 dark:text-rose-400">
                    Còn nợ: {formatCurrency(currentInvoice.remainingAmount)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 italic text-xs py-4">Chưa có hóa đơn nào được phát hành.</p>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {currentInvoice && currentInvoice.remainingAmount > 0 ? (
              <button
                type="button"
                onClick={() => setPaymentInvoice(currentInvoice)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-2"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Thanh toán ngay
              </button>
            ) : currentInvoice ? (
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Đã thanh toán đầy đủ
              </span>
            ) : (
              <div />
            )}

            <Link
              href="/invoices"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-1 ml-auto"
            >
              Xem tất cả hóa đơn <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Section thay thế: Tính năng mới sẽ được cập nhật */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Tiện ích cư dân</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Dịch vụ & Tiện ích mở rộng</p>
                </div>
              </div>
            </div>

            {/* Nội dung để trống theo yêu cầu và hiển thị thông báo tính năng mới */}
            <div className="py-14 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-inner">
                <Layers className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Tính năng mới sẽ được cập nhật
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed">
                Ban Quản Lý đang phát triển thêm các tiện ích cư dân (yêu cầu sửa chữa, gửi xe, tiện ích...). Vui lòng đón chờ!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal thanh toán dành cho cư dân */}
      {paymentInvoice && (
        <PaymentModal
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          invoice={paymentInvoice}
          onPaymentSuccess={() => fetchDashboard()}
        />
      )}
    </div>
  );
}
