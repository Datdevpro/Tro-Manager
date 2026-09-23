"use client";

import React, { useEffect, useState } from "react";
import {
  DoorOpen,
  Home,
  Wrench,
  Users,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Receipt,
  CreditCard,
  Building,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl lg:col-span-2" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { kpi, charts, recentInvoices, recentPayments } = data;
  const occupancyPercent = kpi.totalRooms > 0 ? Math.round((kpi.occupiedRooms / kpi.totalRooms) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Tổng quan Quản lý"
        description="Báo cáo tình hình hoạt động, doanh thu và vận hành hệ thống nhà trọ."
        icon={Building}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/invoices"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              Tạo hóa đơn tháng
            </Link>
          </div>
        }
      />

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng số phòng"
          value={kpi.totalRooms}
          subtext={`Lấp đầy: ${occupancyPercent}%`}
          icon={DoorOpen}
          colorScheme="indigo"
        />
        <StatCard
          title="Phòng đang thuê"
          value={kpi.occupiedRooms}
          subtext={`${kpi.availableRooms} phòng trống sẵn sàng`}
          icon={Home}
          colorScheme="blue"
        />
        <StatCard
          title="Khách đang thuê"
          value={kpi.totalTenants}
          subtext="Cư dân đang cư trú"
          icon={Users}
          colorScheme="emerald"
        />
        <StatCard
          title="Phòng bảo trì"
          value={kpi.maintenanceRooms}
          subtext="Cần kiểm tra kỹ thuật"
          icon={Wrench}
          colorScheme="amber"
        />
      </div>

      {/* Row 2: Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Doanh thu thực thu tháng này"
          value={formatCurrency(kpi.currentMonthRevenue)}
          subtext="Tính theo thanh toán đã ghi nhận"
          icon={DollarSign}
          colorScheme="emerald"
        />
        <StatCard
          title="Tổng tiền chưa thanh toán"
          value={formatCurrency(kpi.totalUnpaidAmount)}
          subtext="Gồm hóa đơn chưa thu & quá hạn"
          icon={AlertCircle}
          colorScheme="amber"
        />
        <StatCard
          title="Hóa đơn quá hạn"
          value={`${kpi.overdueInvoicesCount} hóa đơn`}
          subtext="Cần gửi thông báo nhắc nhở"
          icon={Clock}
          colorScheme="rose"
        />
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue 6 months */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Biểu đồ Doanh thu (6 tháng)</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">So sánh thực thu và dự kiến hóa đơn</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" /> Thực thu
              </span>
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-600 inline-block" /> Dự kiến
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}Tr`}
                />
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val), ""]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="revenue" name="Thực thu" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expected" name="Dự kiến" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Occupancy Donut */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col">
          <div className="mb-2">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Tỷ lệ Lấp đầy Phòng</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">Phân bố trạng thái phòng hiện tại</p>
          </div>

          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={charts.occupancyData}
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.occupancyData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            {charts.occupancyData.map((item: any) => (
              <div key={item.name}>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Invoices & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Hóa đơn gần đây</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Các hóa đơn phát hành mới nhất</p>
            </div>
            <Link
              href="/admin/invoices"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-0.5"
            >
              Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="pb-2.5">Phòng / Khách</th>
                  <th className="pb-2.5">Kỳ hạn</th>
                  <th className="pb-2.5">Tổng tiền</th>
                  <th className="pb-2.5 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{inv.room.roomNumber}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[120px]">
                        {inv.tenant.user.fullName}
                      </p>
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 font-medium">T{inv.month.split("-")[1]}</td>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="py-3 text-right">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Giao dịch thanh toán gần đây</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Lịch sử thu tiền mặt & chuyển khoản</p>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-0.5"
            >
              Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="pb-2.5">Phòng / Ngày</th>
                  <th className="pb-2.5">Phương thức</th>
                  <th className="pb-2.5 text-right">Số tiền thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentPayments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3">
                      <p className="font-bold text-slate-800 dark:text-slate-100">
                        {p.invoice?.room?.roomNumber || "Hóa đơn"}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">{formatDate(p.paymentDate)}</p>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {p.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản" : "Tiền mặt"}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      +{formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
