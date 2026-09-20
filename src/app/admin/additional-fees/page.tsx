"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Coins,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Building,
  DoorOpen,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/utils";
import { toast } from "sonner";

export default function AdditionalFeesPage() {
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const [fees, setFees] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [monthFilter, setMonthFilter] = useState(currentMonth);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [search, setSearch] = useState("");

  // Properties & Rooms for modal
  const [properties, setProperties] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load properties & rooms
  useEffect(() => {
    async function loadMeta() {
      try {
        const [pRes, rRes] = await Promise.all([
          fetch("/api/properties"),
          fetch("/api/rooms?pageSize=200"),
        ]);
        const pJson = await pRes.json();
        const rJson = await rRes.json();
        if (pJson.success) setProperties(pJson.data);
        if (rJson.success) setRooms(rJson.data.items);
      } catch {
        // Quiet fail
      }
    }
    loadMeta();
  }, []);

  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (monthFilter) params.set("month", monthFilter);
      if (propertyFilter) params.set("propertyId", propertyFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/additional-fees?${params.toString()}`);
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        toast.error(`Máy chủ phản hồi lỗi (${res.status}): Không thể đọc dữ liệu`);
        return;
      }

      if (res.ok && json?.success) {
        setFees(json.data?.items || []);
        setTotalAmount(json.data?.totalAmount || 0);
      } else {
        toast.error(json?.message || "Lỗi khi tải danh sách chi phí phát sinh");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi tải danh sách chi phí phát sinh");
    } finally {
      setLoading(false);
    }
  }, [monthFilter, propertyFilter, search]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const openCreateModal = () => {
    setEditingFee(null);
    setSelectedPropertyId(properties[0]?.id || "");
    setRoomId("");
    setMonth(monthFilter || currentMonth);
    setTitle("");
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (fee: any) => {
    setEditingFee(fee);
    const pId = fee.room?.property?.id || "";
    setSelectedPropertyId(pId);
    setRoomId(fee.roomId);
    setMonth(fee.month);
    setTitle(fee.title);
    setAmount(String(fee.amount));
    setDescription(fee.description || "");
    setDate(
      fee.date ? new Date(fee.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
    );
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) {
      toast.error("Vui lòng chọn phòng trọ");
      return;
    }
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên khoản phát sinh");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Số tiền phát sinh phải lớn hơn 0");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingFee ? `/api/additional-fees/${editingFee.id}` : "/api/additional-fees";
      const method = editingFee ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          month,
          title: title.trim(),
          amount: numAmount,
          description: description.trim() || undefined,
          date,
        }),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        toast.error(`Máy chủ phản hồi lỗi (${res.status})`);
        return;
      }

      if (res.ok && json?.success) {
        toast.success(json.message || "Lưu thành công");
        setIsModalOpen(false);
        fetchFees();
      } else {
        toast.error(json?.message || "Thao tác không thành công");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/additional-fees/${deleteId}`, {
        method: "DELETE",
      });
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        toast.error(`Máy chủ phản hồi lỗi (${res.status})`);
        return;
      }

      if (res.ok && json?.success) {
        toast.success(json.message || "Đã xóa khoản phát sinh");
        setDeleteId(null);
        fetchFees();
      } else {
        toast.error(json?.message || "Không thể xóa khoản phát sinh");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi kết nối máy chủ");
    } finally {
      setDeleting(false);
    }
  };

  // Rooms filtered by property in modal
  const modalRooms = selectedPropertyId
    ? rooms.filter((r) => r.propertyId === selectedPropertyId || r.property?.id === selectedPropertyId)
    : rooms;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Chi Phí Phát Sinh"
        description="Ghi nhận các khoản chi phí phát sinh đột xuất theo phòng (sửa chữa, đền bù, phụ thu...). Các khoản này sẽ tự động được gộp vào hóa đơn tổng cuối tháng."
        icon={Coins}
        actions={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            Ghi nhận phát sinh
          </button>
        }
      />

      {/* Thông tin giải thích */}
      <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Cơ chế tự động:</strong> Khi bạn ghi nhận chi phí phát sinh cho một phòng trong kỳ tháng nào, khi hệ thống xuất hóa đơn tháng đó (hoặc xuất hàng loạt), toàn bộ các khoản phát sinh sẽ được <strong>tự động tính tổng và điền vào mục &quot;Phí khác&quot;</strong> của hóa đơn!
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tổng tiền phát sinh kỳ này
          </span>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {formatCurrency(totalAmount)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {monthFilter ? `Kỳ ${formatMonthYear(monthFilter)}` : "Tất cả các kỳ"}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Số khoản phát sinh
          </span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {fees.length}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Giao dịch ghi nhận</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Số phòng có phát sinh
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {new Set(fees.map((f) => f.roomId)).size}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Phòng trọ liên quan</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Lọc theo tháng */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Kỳ tháng:</span>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950 font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Lọc theo khu trọ */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Khu trọ:</span>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">-- Tất cả khu trọ --</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tìm kiếm */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo phòng, tên phát sinh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton className="h-14 rounded-2xl" count={4} />
      ) : fees.length === 0 ? (
        <EmptyState
          title="Chưa có chi phí phát sinh nào"
          description="Bấm 'Ghi nhận phát sinh' để thêm các khoản phụ thu, sửa chữa hoặc đền bù cho phòng trọ."
          icon={Coins}
          action={
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
            >
              <Plus className="w-4 h-4" />
              Ghi nhận ngay
            </button>
          }
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Ngày</th>
                  <th className="px-5 py-3.5">Phòng / Khu trọ</th>
                  <th className="px-5 py-3.5">Khoản phát sinh</th>
                  <th className="px-5 py-3.5">Số tiền</th>
                  <th className="px-5 py-3.5">Kỳ áp dụng</th>
                  <th className="px-5 py-3.5">Ghi chú</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fees.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {formatDate(item.date || item.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        Phòng {item.room?.roomNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {item.room?.property?.name}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {item.title}
                    </td>

                    <td className="px-5 py-4 font-extrabold text-slate-900 dark:text-white text-sm">
                      +{formatCurrency(item.amount)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                        {formatMonthYear(item.month)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-500 max-w-xs truncate">
                      {item.description || <span className="italic text-slate-400">--</span>}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal Thêm / Sửa Phát Sinh */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFee ? "Sửa Chi Phí Phát Sinh" : "Ghi Nhận Chi Phí Phát Sinh"}
        description="Chi phí này sẽ được tự động cộng vào hóa đơn tổng cuối tháng của phòng."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Thuộc khu trọ *
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value);
                  setRoomId("");
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
              >
                <option value="">-- Chọn khu trọ --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Chọn phòng trọ *
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={!selectedPropertyId}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 font-medium"
              >
                <option value="">
                  {selectedPropertyId ? "-- Chọn phòng --" : "-- Chọn khu trọ trước --"}
                </option>
                {modalRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Phòng {r.roomNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Kỳ hóa đơn áp dụng *
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Ngày phát sinh
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tên khoản phát sinh / Lý do *
            </label>
            <input
              type="text"
              placeholder="VD: Đền bù vỡ cửa kính, Sửa khóa phòng, Tiền phạt quá giờ..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Số tiền phát sinh (VNĐ) *
            </label>
            <input
              type="number"
              min={1000}
              step={1000}
              placeholder="VD: 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-extrabold bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Ghi chú thêm
            </label>
            <textarea
              rows={2}
              placeholder="Chi tiết về nguyên nhân, biên bản hoặc hẹn nộp..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {submitting ? "Đang lưu..." : editingFee ? "Lưu thay đổi" : "Ghi nhận phát sinh"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Dialog Xóa */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa khoản phát sinh?"
        message="Khoản phí phát sinh này sẽ bị xóa và không còn được gộp vào hóa đơn của phòng."
        confirmText="Xóa khoản này"
        isDestructive
        isLoading={deleting}
      />
    </div>
  );
}
