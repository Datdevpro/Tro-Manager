"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Zap,
  Droplet,
  Plus,
  Edit,
  History,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormModal } from "@/components/ui/FormModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatCurrency, formatMonthYear } from "@/lib/utils";
import { toast } from "sonner";

export default function UtilitiesPage() {
  const [readings, setReadings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Month selector (default current month)
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedProperty, setSelectedProperty] = useState("");

  // Modal Record / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<any>(null);

  // Form states
  const [roomId, setRoomId] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [electricOld, setElectricOld] = useState(0);
  const [electricNew, setElectricNew] = useState(0);
  const [waterOld, setWaterOld] = useState(0);
  const [waterNew, setWaterNew] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Room history modal
  const [roomHistory, setRoomHistory] = useState<any[]>([]);
  const [historyRoomName, setHistoryRoomName] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const fetchReadings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedMonth) params.set("month", selectedMonth);
      if (selectedProperty) params.set("propertyId", selectedProperty);

      const res = await fetch(`/api/utilities?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setReadings(json.data);
      }
    } catch {
      toast.error("Lỗi khi tải danh sách chỉ số");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedProperty]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  // Load rooms and properties
  useEffect(() => {
    async function loadMeta() {
      const [rRes, pRes] = await Promise.all([
        fetch("/api/rooms?pageSize=100"),
        fetch("/api/properties"),
      ]);
      const [rJson, pJson] = await Promise.all([rRes.json(), pRes.json()]);
      if (rJson.success) setRooms(rJson.data.items);
      if (pJson.success) setProperties(pJson.data);
    }
    loadMeta();
  }, []);

  const openRecordModal = (item?: any) => {
    if (item) {
      setEditingReading(item);
      setRoomId(item.roomId);
      setMonth(item.month);
      setElectricOld(item.electricOld);
      setElectricNew(item.electricNew);
      setWaterOld(item.waterOld);
      setWaterNew(item.waterNew);
    } else {
      setEditingReading(null);
      setRoomId(rooms[0]?.id || "");
      setMonth(selectedMonth);
      setElectricOld(0);
      setElectricNew(0);
      setWaterOld(0);
      setWaterNew(0);
    }
    setIsModalOpen(true);
  };

  const openHistoryModal = async (room: any) => {
    try {
      setHistoryRoomName(`${room.roomNumber} (${room.property?.name})`);
      const res = await fetch(`/api/utilities?roomId=${room.id}`);
      const json = await res.json();
      if (json.success) {
        setRoomHistory(json.data);
        setIsHistoryOpen(true);
      }
    } catch {
      toast.error("Lỗi tải lịch sử phòng");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !month) {
      toast.error("Vui lòng chọn phòng và tháng");
      return;
    }

    if (electricNew < electricOld) {
      toast.error("Chỉ số điện mới không được nhỏ hơn chỉ số cũ");
      return;
    }

    if (waterNew < waterOld) {
      toast.error("Chỉ số nước mới không được nhỏ hơn chỉ số cũ");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/utilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          month,
          electricOld,
          electricNew,
          waterOld,
          waterNew,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setIsModalOpen(false);
        fetchReadings();
      } else {
        toast.error(json.message || "Lỗi cập nhật chỉ số");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Điện & Nước"
        description="Ghi nhận chỉ số điện nước hằng tháng theo từng phòng và tự động tính toán chi phí tiêu thụ."
        icon={Zap}
        actions={
          <button
            onClick={() => openRecordModal()}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nhập chỉ số phòng
          </button>
        }
      />

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Month picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase">Kỳ tháng:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Property selector */}
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Tất cả khu trọ</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Đã ghi nhận: <span className="font-bold text-slate-900">{readings.length}</span> phòng
        </span>
      </div>

      {/* Utilities Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Phòng / Khu trọ</th>
                <th className="px-5 py-3.5">Khách đang ở</th>
                <th className="px-5 py-3.5">Chỉ số Điện (Cũ → Mới)</th>
                <th className="px-5 py-3.5">Tiêu thụ & Tiền Điện</th>
                <th className="px-5 py-3.5">Chỉ số Nước (Cũ → Mới)</th>
                <th className="px-5 py-3.5">Tiêu thụ & Tiền Nước</th>
                <th className="px-5 py-3.5">Tổng tiền</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    <LoadingSkeleton className="h-8 w-full mb-2" count={5} />
                  </td>
                </tr>
              ) : readings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <EmptyState
                      title="Chưa có chỉ số tháng này"
                      description={`Chưa có số liệu điện nước cho ${formatMonthYear(selectedMonth)}.`}
                      icon={Zap}
                      action={
                        <button
                          onClick={() => openRecordModal()}
                          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                        >
                          Nhập chỉ số ngay
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                readings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 block text-sm">
                        {r.room.roomNumber}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {r.room.property?.name}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {r.room.tenants && r.room.tenants[0] ? (
                        <span className="font-semibold text-indigo-700">
                          {r.room.tenants[0].user.fullName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Trống</span>
                      )}
                    </td>

                    {/* Electric */}
                    <td className="px-5 py-4">
                      <div className="font-mono text-slate-700">
                        <span>{r.electricOld}</span>
                        <span className="text-slate-400 mx-1">→</span>
                        <span className="font-bold text-slate-900">{r.electricNew}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-amber-600 block">
                        {r.electricUsage} kWh
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formatCurrency(r.electricCost)}
                      </span>
                    </td>

                    {/* Water */}
                    <td className="px-5 py-4">
                      <div className="font-mono text-slate-700">
                        <span>{r.waterOld}</span>
                        <span className="text-slate-400 mx-1">→</span>
                        <span className="font-bold text-slate-900">{r.waterNew}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-blue-600 block">
                        {r.waterUsage} m³
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formatCurrency(r.waterCost)}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-5 py-4">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatCurrency(r.totalUtilityCost)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openHistoryModal(r.room)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                          title="Lịch sử dùng điện nước"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openRecordModal(r)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                          title="Cập nhật chỉ số"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Record Readings */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReading ? "Cập nhật chỉ số điện nước" : "Nhập chỉ số điện nước"}
        description="Nhập số công tơ điện và đồng hồ nước đầu kỳ - cuối kỳ"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Phòng trọ *
              </label>
              <select
                required
                disabled={!!editingReading}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-100"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} ({r.property?.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tháng ghi nhận *
              </label>
              <input
                type="month"
                required
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          {/* Electric */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl">
            <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              Chỉ số Điện (kWh)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Chỉ số Điện Cũ (đầu tháng)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={electricOld}
                  onChange={(e) => setElectricOld(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Chỉ số Điện Mới (cuối tháng)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={electricNew}
                  onChange={(e) => setElectricNew(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                />
              </div>
            </div>
            {electricNew >= electricOld && (
              <p className="text-xs text-amber-700 font-medium mt-2">
                Tiêu thụ: <span className="font-bold">{electricNew - electricOld} kWh</span>
              </p>
            )}
          </div>

          {/* Water */}
          <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-2xl">
            <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-blue-600" />
              Chỉ số Nước (m³)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Chỉ số Nước Cũ (đầu tháng)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={waterOld}
                  onChange={(e) => setWaterOld(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Chỉ số Nước Mới (cuối tháng)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={waterNew}
                  onChange={(e) => setWaterNew(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                />
              </div>
            </div>
            {waterNew >= waterOld && (
              <p className="text-xs text-blue-700 font-medium mt-2">
                Tiêu thụ: <span className="font-bold">{waterNew - waterOld} m³</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {submitting ? "Đang lưu..." : "Lưu chỉ số"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Modal Room History */}
      <FormModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Lịch sử Điện Nước: ${historyRoomName}`}
        description="Biến động sử dụng điện và nước qua các tháng"
        maxWidth="lg"
      >
        <div className="space-y-3 text-xs">
          {roomHistory.length === 0 ? (
            <p className="text-slate-400 italic text-center py-6">Chưa có lịch sử nào.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {roomHistory.map((h: any) => (
                <div key={h.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">
                      {formatMonthYear(h.month)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Điện: {h.electricUsage} kWh ({h.electricOld} → {h.electricNew})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-indigo-600 block text-sm">
                      {formatCurrency(h.totalUtilityCost)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Nước: {h.waterUsage} m³ ({h.waterOld} → {h.waterNew})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
