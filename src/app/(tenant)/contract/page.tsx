"use client";

import React, { useEffect, useState } from "react";
import { FileText, Calendar, Building, DollarSign, CheckCircle2, Shield } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function TenantContractPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContract() {
      try {
        setLoading(true);
        const res = await fetch("/api/tenant/contract");
        const json = await res.json();
        if (json.success) {
          setContracts(json.data);
        }
      } catch {
        toast.error("Lỗi tải thông tin hợp đồng");
      } finally {
        setLoading(false);
      }
    }
    loadContract();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hợp đồng Thuê nhà của tôi"
        description="Chi tiết điều khoản pháp lý, quyền và nghĩa vụ theo hợp đồng thuê phòng trọ."
        icon={FileText}
      />

      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton className="h-64 rounded-3xl" count={1} />
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          title="Chưa có hợp đồng nào"
          description="Bạn hiện chưa có hợp đồng thuê phòng nào được ký kết."
          icon={FileText}
        />
      ) : (
        <div className="space-y-6">
          {contracts.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
            >
              {/* Header card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Mã hợp đồng: #{c.id.slice(-8).toUpperCase()}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    Hợp đồng Thuê Phòng {c.room?.roomNumber}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tòa nhà: {c.room?.property?.name} - {c.room?.property?.address}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>

              {/* Terms grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs text-slate-500 block">Thời hạn hợp đồng</span>
                  <span className="text-sm font-bold text-slate-900 block mt-1">
                    {formatDate(c.startDate)} → {formatDate(c.endDate)}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs text-slate-500 block">Giá thuê thỏa thuận</span>
                  <span className="text-sm font-extrabold text-indigo-600 block mt-1">
                    {formatCurrency(c.rentPrice)} / tháng
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs text-slate-500 block">Tiền đặt cọc</span>
                  <span className="text-sm font-extrabold text-slate-800 block mt-1">
                    {formatCurrency(c.deposit)}
                  </span>
                </div>
              </div>

              {/* Full Terms text */}
              <div className="p-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  Điều khoản và Quy định chung
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {c.terms ||
                    "Hợp đồng thuê nhà tuân thủ các quy định phòng cháy chữa cháy, an ninh trật tự khu phố và cam kết thanh toán đúng hạn."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
