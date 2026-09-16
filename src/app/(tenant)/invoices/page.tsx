"use client";

import React, { useEffect, useState } from "react";
import { Receipt, Eye, Printer, Calendar, Clock, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FormModal } from "@/components/ui/FormModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate, formatCurrency, formatMonthYear } from "@/lib/utils";
import { toast } from "sonner";

export default function TenantInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tenant/invoices");
      const json = await res.json();
      if (json.success) {
        setInvoices(json.data);
      }
    } catch {
      toast.error("Lỗi khi tải hóa đơn cá nhân");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openInvoiceDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/tenant/invoices/${id}`);
      const json = await res.json();
      if (json.success) {
        setViewingInvoice(json.data);
      } else {
        toast.error(json.message || "Không thể xem chi tiết");
      }
    } catch {
      toast.error("Lỗi tải chi tiết");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hóa đơn Tiền phòng của tôi"
        description="Tra cứu lịch sử và chi tiết các khoản phí tiền phòng, điện nước hằng tháng."
        icon={Receipt}
      />

      {loading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-14 rounded-2xl" count={4} />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          title="Chưa có hóa đơn nào"
          description="Hiện tại bạn chưa có hóa đơn tiền phòng nào được phát hành."
          icon={Receipt}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Kỳ tháng</th>
                  <th className="px-5 py-3.5">Phòng</th>
                  <th className="px-5 py-3.5">Tổng tiền</th>
                  <th className="px-5 py-3.5">Đã thanh toán</th>
                  <th className="px-5 py-3.5">Còn nợ</th>
                  <th className="px-5 py-3.5">Hạn thanh toán</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 font-bold text-slate-900 text-sm">
                      {formatMonthYear(inv.month)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-indigo-600">
                      {inv.room?.roomNumber}
                    </td>
                    <td className="px-5 py-4 font-extrabold text-slate-900">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-emerald-600">
                      +{formatCurrency(inv.paidAmount)}
                    </td>
                    <td className="px-5 py-4 font-bold text-rose-600">
                      {formatCurrency(inv.remainingAmount)}
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openInvoiceDetail(inv.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      <FormModal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        title="Chi Tiết Hóa Đơn Tiền Nhà"
        description="Bản kê giải thích rõ từng khoản tiền theo thực tế sử dụng"
        maxWidth="lg"
      >
        {viewingInvoice && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-slate-500 font-medium">Kỳ hóa đơn:</span>
                <h4 className="text-lg font-extrabold text-slate-900">
                  {formatMonthYear(viewingInvoice.month)}
                </h4>
                <p className="text-xs text-indigo-600 font-bold">
                  Phòng {viewingInvoice.room?.roomNumber} ({viewingInvoice.room?.property?.name})
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={viewingInvoice.status} />
                <p className="text-[11px] text-slate-500 mt-1">
                  Hạn đóng: {formatDate(viewingInvoice.dueDate)}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase">
                  <tr>
                    <th className="p-3">Hạng mục thanh toán</th>
                    <th className="p-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-medium text-slate-800">1. Tiền thuê phòng trọ</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatCurrency(viewingInvoice.roomFee)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">2. Tiền điện sử dụng</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatCurrency(viewingInvoice.electricFee)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">3. Tiền nước sinh hoạt</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatCurrency(viewingInvoice.waterFee)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">4. Phí dịch vụ (Wifi, Rác, Xe máy...)</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatCurrency(viewingInvoice.serviceFee)}
                    </td>
                  </tr>
                  {viewingInvoice.otherFee > 0 && (
                    <tr>
                      <td className="p-3 font-medium text-slate-800">5. Phí khác phát sinh</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {formatCurrency(viewingInvoice.otherFee)}
                      </td>
                    </tr>
                  )}
                  {viewingInvoice.previousDebt > 0 && (
                    <tr>
                      <td className="p-3 font-medium text-rose-600">6. Nợ tháng trước chuyển sang</td>
                      <td className="p-3 text-right font-bold text-rose-600">
                        +{formatCurrency(viewingInvoice.previousDebt)}
                      </td>
                    </tr>
                  )}
                  {viewingInvoice.discount > 0 && (
                    <tr>
                      <td className="p-3 font-medium text-emerald-600">7. Chiết khấu / Giảm trừ</td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        -{formatCurrency(viewingInvoice.discount)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                  <tr>
                    <td className="p-3.5 text-sm uppercase">Tổng cộng:</td>
                    <td className="p-3.5 text-right text-base text-indigo-700">
                      {formatCurrency(viewingInvoice.total)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 text-emerald-700">Đã thanh toán:</td>
                    <td className="p-3 text-right text-emerald-700 font-bold">
                      +{formatCurrency(viewingInvoice.paidAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 text-rose-700">Còn lại phải nộp:</td>
                    <td className="p-3 text-right text-rose-700 font-extrabold text-sm">
                      {formatCurrency(viewingInvoice.remainingAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}
