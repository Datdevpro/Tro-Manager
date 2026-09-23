"use client";

import React, { useEffect, useState } from "react";
import { Receipt, Eye, Printer, Calendar, Clock, DollarSign, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FormModal } from "@/components/ui/FormModal";
import { PaymentModal } from "@/components/tenant/PaymentModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate, formatCurrency, formatMonthYear } from "@/lib/utils";
import { toast } from "sonner";

export default function TenantInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null);

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
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Kỳ tháng</th>
                  <th className="px-5 py-3.5">Phòng</th>
                  <th className="px-5 py-3.5">Tổng tiền</th>
                  <th className="px-5 py-3.5">Đã thanh toán</th>
                  <th className="px-5 py-3.5">Còn nợ</th>
                  <th className="px-5 py-3.5">Hạn thanh toán</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white text-sm">
                      {formatMonthYear(inv.month)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-indigo-600 dark:text-indigo-400">
                      {inv.room?.roomNumber}
                    </td>
                    <td className="px-5 py-4 font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-emerald-700 dark:text-emerald-400">
                      +{formatCurrency(inv.paidAmount)}
                    </td>
                    <td className="px-5 py-4 font-bold text-rose-700 dark:text-rose-400">
                      {formatCurrency(inv.remainingAmount)}
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-medium">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.remainingAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => setPaymentInvoice(inv)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition inline-flex items-center gap-1 shadow-xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Thanh toán
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openInvoiceDetail(inv.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem
                        </button>
                      </div>
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
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Kỳ hóa đơn:</span>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {formatMonthYear(viewingInvoice.month)}
                </h4>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                  Phòng {viewingInvoice.room?.roomNumber} ({viewingInvoice.room?.property?.name})
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={viewingInvoice.status} />
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Hạn đóng: {formatDate(viewingInvoice.dueDate)}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] uppercase">
                  <tr>
                    <th className="p-3">Hạng mục thanh toán</th>
                    <th className="p-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">1. Tiền thuê phòng trọ</td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(viewingInvoice.roomFee)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">2. Tiền điện sử dụng</td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(viewingInvoice.electricFee)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">3. Tiền nước sinh hoạt</td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(viewingInvoice.waterFee)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">4. Phí dịch vụ (Wifi, Rác, Xe máy...)</td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(viewingInvoice.serviceFee)}
                    </td>
                  </tr>
                  {viewingInvoice.otherFee > 0 && (
                    <tr>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                        <div className="font-semibold text-slate-900 dark:text-white">5. Phí khác phát sinh</div>
                        {viewingInvoice.additionalFees && viewingInvoice.additionalFees.length > 0 && (
                          <div className="mt-1.5 space-y-1 bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-100 dark:border-amber-900/50 text-[11px] text-amber-900 dark:text-amber-300 font-normal">
                            <span className="font-semibold text-[10px] text-amber-800 dark:text-amber-400 uppercase tracking-wider block">Các khoản chi phí phát sinh:</span>
                            {viewingInvoice.additionalFees.map((af: any) => (
                              <div key={af.id} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                                <span>• {af.title}{af.description ? ` (${af.description})` : ""}</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(af.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white align-top">
                        {formatCurrency(viewingInvoice.otherFee)}
                      </td>
                    </tr>
                  )}
                  {viewingInvoice.previousDebt > 0 && (
                    <tr>
                      <td className="p-3 font-medium text-rose-700 dark:text-rose-400">6. Nợ tháng trước chuyển sang</td>
                      <td className="p-3 text-right font-bold text-rose-700 dark:text-rose-400">
                        +{formatCurrency(viewingInvoice.previousDebt)}
                      </td>
                    </tr>
                  )}
                  {viewingInvoice.discount > 0 && (
                    <tr>
                      <td className="p-3 font-medium text-emerald-700 dark:text-emerald-400">7. Chiết khấu / Giảm trừ</td>
                      <td className="p-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                        -{formatCurrency(viewingInvoice.discount)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <td className="p-3.5 text-sm uppercase text-slate-900 dark:text-white">Tổng cộng:</td>
                    <td className="p-3.5 text-right text-base text-indigo-700 dark:text-indigo-400">
                      {formatCurrency(viewingInvoice.total)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 text-emerald-700 dark:text-emerald-400">Đã thanh toán:</td>
                    <td className="p-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">
                      +{formatCurrency(viewingInvoice.paidAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 text-rose-700 dark:text-rose-400">Còn lại phải nộp:</td>
                    <td className="p-3 text-right text-rose-700 dark:text-rose-400 font-extrabold text-sm">
                      {formatCurrency(viewingInvoice.remainingAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {viewingInvoice.remainingAmount > 0 ? (
                <button
                  type="button"
                  onClick={() => setPaymentInvoice(viewingInvoice)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Thanh toán hóa đơn này
                </button>
              ) : (
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                  ✓ Hóa đơn đã được thanh toán đầy đủ
                </span>
              )}

              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-200 transition text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </FormModal>

      {/* Payment Modal */}
      {paymentInvoice && (
        <PaymentModal
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          invoice={paymentInvoice}
          onPaymentSuccess={() => {
            fetchInvoices();
            if (viewingInvoice && viewingInvoice.id === paymentInvoice.id) {
              openInvoiceDetail(paymentInvoice.id);
            }
          }}
        />
      )}
    </div>
  );
}
