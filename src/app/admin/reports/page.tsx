"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  PieChart as PieIcon,
  Download,
  Building,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatCurrency } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/dashboard");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch {
        toast.error("Lỗi khi tải báo cáo");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-64 rounded-3xl" count={2} />
      </div>
    );
  }

  const { kpi, charts } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Báo cáo & Thống kê Tài chính"
        description="Tổng hợp dòng tiền, tỷ lệ lấp đầy phòng, tình hình công nợ và hiệu quả kinh doanh."
        icon={BarChart3}
        actions={
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Xuất báo cáo PDF / In
          </button>
        }
      />

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider block">
            Doanh thu thực thu tháng này
          </span>
          <h3 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">
            {formatCurrency(kpi.currentMonthRevenue)}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đã đối soát từ phiếu thu tiền</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider block">
            Tổng công nợ chưa thu
          </span>
          <h3 className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-2">
            {formatCurrency(kpi.totalUnpaidAmount)}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gồm {kpi.overdueInvoicesCount} hóa đơn đã quá hạn
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider block">
            Tỷ lệ lấp đầy toàn hệ thống
          </span>
          <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
            {kpi.totalRooms > 0 ? Math.round((kpi.occupiedRooms / kpi.totalRooms) * 100) : 0}%
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {kpi.occupiedRooms} / {kpi.totalRooms} phòng đang sinh sống
          </p>
        </div>
      </div>

      {/* Revenue Analysis Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
          Xu hướng Doanh thu 6 tháng gần nhất
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
          Biểu đồ so sánh dòng tiền thực nhận (tiền mặt + chuyển khoản) và tổng dự kiến phát hành
        </p>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}Tr`}
              />
              <Tooltip formatter={(val: number) => [formatCurrency(val), ""]} />
              <Legend />
              <Bar dataKey="revenue" name="Thực thu" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expected" name="Dự thu" fill="#94a3b8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operational Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">Cơ cấu Trạng thái Phòng</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.occupancyData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">Chỉ số Hiệu quả Vận hành</h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Tổng số phòng quản lý:</span>
                <span className="font-bold text-slate-900 dark:text-white">{kpi.totalRooms} phòng</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Phòng sẵn sàng cho thuê ngay:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{kpi.availableRooms} phòng</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Phòng cần bảo trì, sửa chữa:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">{kpi.maintenanceRooms} phòng</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Tổng số khách thuê thường trú:</span>
                <span className="font-bold text-slate-900 dark:text-white">{kpi.totalTenants} người</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 mt-4">
            Đánh giá: Tỷ lệ lấp đầy đạt mức tốt. Cần đẩy mạnh thu hồi {kpi.overdueInvoicesCount} hóa đơn quá hạn để đảm bảo dòng tiền lành mạnh.
          </div>
        </div>
      </div>
    </div>
  );
}
