"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, Calendar, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate, formatCurrency, formatMonthYear } from "@/lib/utils";
import { toast } from "sonner";

export default function TenantPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        const res = await fetch("/api/tenant/payments");
        const json = await res.json();
        if (json.success) {
          setPayments(json.data);
        }
      } catch {
        toast.error("Lỗi khi tải lịch sử thanh toán");
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch sử Thanh toán của tôi"
        description="Các khoản tiền phòng, điện nước bạn đã nộp cho Ban Quản Lý tòa nhà."
        icon={CreditCard}
      />

      {loading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-16 rounded-2xl" count={3} />
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          title="Chưa có giao dịch thanh toán"
          description="Lịch sử thanh toán sẽ xuất hiện tại đây sau khi bạn nộp tiền phòng."
          icon={CreditCard}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Ngày nộp</th>
                  <th className="px-5 py-3.5">Hóa đơn kỳ</th>
                  <th className="px-5 py-3.5">Phương thức</th>
                  <th className="px-5 py-3.5">Số tiền đã nộp</th>
                  <th className="px-5 py-3.5">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {formatDate(p.paymentDate)}
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-900">
                      {p.invoice ? formatMonthYear(p.invoice.month) : "Hóa đơn"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {p.paymentMethod === "BANK_TRANSFER"
                          ? "Chuyển khoản"
                          : p.paymentMethod === "CASH"
                          ? "Tiền mặt"
                          : "Khác"}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-extrabold text-emerald-600 text-sm">
                      +{formatCurrency(p.amount)}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {p.note || <span className="text-slate-400 italic">--</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
