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
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

export default function TenantDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl md:col-span-2" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
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
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Phòng thuê hiện tại</h3>
                  <p className="text-xs text-slate-500">Thông tin phòng & tiện ích</p>
                </div>
              </div>
              {currentRoom && <StatusBadge status={currentRoom.status} />}
            </div>

            {currentRoom ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tòa nhà / Khu trọ:</span>
                  <span className="font-bold text-slate-900">{currentRoom.property?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Địa chỉ:</span>
                  <span className="font-medium text-slate-700 text-right max-w-[240px] truncate">
                    {currentRoom.property?.address}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tiền phòng hằng tháng:</span>
                  <span className="font-extrabold text-indigo-600 text-sm">
                    {formatCurrency(currentRoom.rentPrice)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tiền cọc giữ chỗ:</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(currentRoom.deposit)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Ngày bắt đầu vào ở:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(tenant.startDate)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic text-xs py-4">Bạn chưa được gán phòng nào.</p>
            )}
          </div>
        </div>

        {/* Current Contract */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hợp đồng thuê phòng</h3>
                  <p className="text-xs text-slate-500">Thời hạn cam kết & trạng thái</p>
                </div>
              </div>
              {currentContract && <StatusBadge status={currentContract.status} />}
            </div>

            {currentContract ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Ngày bắt đầu hợp đồng:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(currentContract.startDate)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Ngày hết hạn hợp đồng:</span>
                  <span className="font-bold text-rose-600">
                    {formatDate(currentContract.endDate)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Kỳ hạn thanh toán:</span>
                  <span className="font-medium text-slate-800">
                    {currentContract.paymentCycle} tháng / lần
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Ghi chú điều khoản:</span>
                  <p className="text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    {currentContract.terms || "Hợp đồng tuân thủ nội quy chung của khu trọ."}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic text-xs py-4">Chưa có hợp đồng nào có hiệu lực.</p>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-right">
            <Link
              href="/contract"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              Xem văn bản hợp đồng đầy đủ <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 2: Current Invoice & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Invoice Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hóa đơn kỳ gần nhất</h3>
                  <p className="text-xs text-slate-500">
                    {currentInvoice ? `Kỳ ${formatMonthYear(currentInvoice.month)}` : "Chưa có hóa đơn"}
                  </p>
                </div>
              </div>
              {currentInvoice && <StatusBadge status={currentInvoice.status} />}
            </div>

            {currentInvoice ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tiền phòng:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(currentInvoice.roomFee)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tiền điện:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(currentInvoice.electricFee)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tiền nước:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(currentInvoice.waterFee)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Phí dịch vụ:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(currentInvoice.serviceFee)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-900">Tổng tiền:</span>
                  <span className="font-extrabold text-indigo-700 text-sm">
                    {formatCurrency(currentInvoice.total)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Hạn thanh toán: {formatDate(currentInvoice.dueDate)}</span>
                  <span className="font-bold text-rose-600">
                    Còn nợ: {formatCurrency(currentInvoice.remainingAmount)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic text-xs py-4">Chưa có hóa đơn nào được phát hành.</p>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-right">
            <Link
              href="/invoices"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              Xem tất cả hóa đơn <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Thông báo cư dân</h3>
                  <p className="text-xs text-slate-500">Thông tin từ Ban Quản Lý tòa nhà</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {recentNotifications.length === 0 ? (
                <p className="text-slate-400 italic text-xs py-4 text-center">
                  Không có thông báo mới nào.
                </p>
              ) : (
                recentNotifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-2xl border transition text-xs flex items-start justify-between gap-3 ${
                      n.isRead
                        ? "bg-slate-50/70 border-slate-100 text-slate-600"
                        : "bg-purple-50/50 border-purple-200 text-slate-900 font-medium"
                    }`}
                  >
                    <div>
                      <h4 className="font-bold mb-1 flex items-center gap-1.5">
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                        )}
                        {n.title}
                      </h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                        {n.content}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={() => markNotificationRead(n.id)}
                        className="px-2 py-1 text-[10px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg shrink-0 transition"
                      >
                        Đã đọc
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
