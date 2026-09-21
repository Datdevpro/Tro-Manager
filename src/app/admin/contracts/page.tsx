"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Calendar,
  DollarSign,
  DoorOpen,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);

  // Form fields
  const [tenantId, setTenantId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentPrice, setRentPrice] = useState(3500000);
  const [deposit, setDeposit] = useState(3500000);
  const [paymentCycle, setPaymentCycle] = useState(1);
  const [terms, setTerms] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [submitting, setSubmitting] = useState(false);

  // View Modal
  const [viewingContract, setViewingContract] = useState<any>(null);

  // Terminate dialog
  const [terminateId, setTerminateId] = useState<string | null>(null);
  const [terminating, setTerminating] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "10");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/contracts?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setContracts(json.data.items);
        setTotalPages(json.data.totalPages);
        setTotalItems(json.data.total);
      }
    } catch {
      toast.error("Lỗi khi tải danh sách hợp đồng");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Load tenants & rooms
  useEffect(() => {
    async function loadData() {
      const [tRes, rRes] = await Promise.all([
        fetch("/api/tenants?pageSize=100"),
        fetch("/api/rooms?pageSize=100"),
      ]);
      const [tJson, rJson] = await Promise.all([tRes.json(), rRes.json()]);
      if (tJson.success) setTenants(tJson.data.items);
      if (rJson.success) setRooms(rJson.data.items);
    }
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingContract(null);
    setTenantId(tenants[0]?.id || "");
    setRoomId(rooms[0]?.id || "");
    const today = new Date().toISOString().split("T")[0];
    const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0];
    setStartDate(today);
    setEndDate(nextYear);
    setRentPrice(rooms[0]?.rentPrice || 3500000);
    setDeposit(rooms[0]?.deposit || 3500000);
    setPaymentCycle(1);
    setTerms(
      "Hợp đồng thuê phòng 12 tháng. Tiền thuê đóng từ ngày 01 đến ngày 05 hằng tháng. Giữ gìn an ninh trật tự và thiết bị trong phòng."
    );
    setStatus("ACTIVE");
    setIsModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setEditingContract(c);
    setTenantId(c.tenantId);
    setRoomId(c.roomId);
    setStartDate(c.startDate.split("T")[0]);
    setEndDate(c.endDate.split("T")[0]);
    setRentPrice(c.rentPrice);
    setDeposit(c.deposit);
    setPaymentCycle(c.paymentCycle);
    setTerms(c.terms || "");
    setStatus(c.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !roomId || !startDate || !endDate) {
      toast.error("Vui lòng điền đầy đủ thông tin hợp đồng");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingContract
        ? `/api/contracts/${editingContract.id}`
        : "/api/contracts";
      const method = editingContract ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          roomId,
          startDate,
          endDate,
          rentPrice,
          deposit,
          paymentCycle,
          terms,
          status,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setIsModalOpen(false);
        fetchContracts();
      } else {
        toast.error(json.message || "Lỗi xử lý hợp đồng");
      }
    } catch {
      toast.error("Lỗi hệ thống");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTerminate = async () => {
    if (!terminateId) return;
    try {
      setTerminating(true);
      const res = await fetch(`/api/contracts/${terminateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "TERMINATED" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Đã thanh lý hợp đồng thành công");
        setTerminateId(null);
        fetchContracts();
      } else {
        toast.error(json.message || "Lỗi thanh lý hợp đồng");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setTerminating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/contracts/${deleteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setDeleteId(null);
        fetchContracts();
      } else {
        toast.error(json.message || "Không thể xóa hợp đồng");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Hợp đồng Thuê"
        description="Lập hợp đồng mới, theo dõi thời hạn thuê phòng, gia hạn và thanh lý hợp đồng."
        icon={FileText}
        actions={
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tạo hợp đồng mới
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Tìm tên khách thuê hoặc số phòng..."
          className="w-full md:w-80"
        />

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hiệu lực (ACTIVE)</option>
            <option value="EXPIRED">Đã hết hạn (EXPIRED)</option>
            <option value="TERMINATED">Đã thanh lý (TERMINATED)</option>
            <option value="PENDING">Chờ duyệt (PENDING)</option>
          </select>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Khách thuê</th>
                <th className="px-5 py-3.5">Phòng / Khu trọ</th>
                <th className="px-5 py-3.5">Thời hạn hợp đồng</th>
                <th className="px-5 py-3.5">Giá thuê / Cọc</th>
                <th className="px-5 py-3.5">Kỳ thanh toán</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    <LoadingSkeleton className="h-8 w-full mb-2" count={5} />
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <EmptyState
                      title="Không có hợp đồng nào"
                      description="Tạo hợp đồng thuê phòng đầu tiên để bắt đầu quản lý."
                      icon={FileText}
                    />
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {c.tenant.user.fullName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {c.tenant.user.fullName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {c.tenant.user.phone || c.tenant.user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-indigo-600 block">
                        {c.room.roomNumber}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {c.room.property?.name}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      <div>
                        <span>{formatDate(c.startDate)}</span>
                        <span className="text-slate-400 mx-1">→</span>
                        <span>{formatDate(c.endDate)}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 block">
                        {formatCurrency(c.rentPrice)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Cọc: {formatCurrency(c.deposit)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {c.paymentCycle} tháng / lần
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={c.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingContract(c)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Xem điều khoản"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {c.status === "ACTIVE" && (
                          <button
                            onClick={() => setTerminateId(c.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Thanh lý hợp đồng"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                          title="Xóa hợp đồng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            pageSize={10}
          />
        </div>
      </div>

      {/* Modal Add / Edit Contract */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingContract ? "Chỉnh sửa hợp đồng" : "Tạo hợp đồng thuê mới"}
        description="Thông tin các bên ký kết, thời hạn hợp đồng, đơn giá và tiền cọc"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Khách thuê *
              </label>
              <select
                required
                disabled={!!editingContract}
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-100"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user.fullName} ({t.user.phone || t.user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Phòng trọ *
              </label>
              <select
                required
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  const selectedR = rooms.find((r) => r.id === e.target.value);
                  if (selectedR) {
                    setRentPrice(selectedR.rentPrice);
                    setDeposit(selectedR.deposit);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} ({r.property?.name}) - {formatCurrency(r.rentPrice)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Ngày bắt đầu hiệu lực *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Ngày kết thúc hợp đồng *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Giá thuê (VNĐ/tháng) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={rentPrice}
                onChange={(e) => setRentPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tiền đặt cọc (VNĐ)
              </label>
              <input
                type="number"
                min={0}
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Kỳ thanh toán (tháng)
              </label>
              <input
                type="number"
                min={1}
                value={paymentCycle}
                onChange={(e) => setPaymentCycle(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Trạng thái hợp đồng
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="ACTIVE">Đang hiệu lực (ACTIVE)</option>
              <option value="EXPIRED">Đã hết hạn (EXPIRED)</option>
              <option value="TERMINATED">Đã thanh lý (TERMINATED)</option>
              <option value="PENDING">Chờ ký kết (PENDING)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Điều khoản & Quy định hợp đồng
            </label>
            <textarea
              rows={4}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Quy định thanh toán, giữ gìn tài sản, thời gian báo trước..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {submitting ? "Đang lưu..." : editingContract ? "Cập nhật hợp đồng" : "Tạo hợp đồng"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* View Details Modal */}
      <FormModal
        isOpen={!!viewingContract}
        onClose={() => setViewingContract(null)}
        title="Chi tiết Hợp đồng Thuê Nhà"
        description="Toàn văn điều khoản và cam kết giữa Ban Quản Lý và Người thuê"
        maxWidth="lg"
      >
        {viewingContract && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Phòng thuê:</span>
                <span className="text-base font-bold text-indigo-600">
                  {viewingContract.room.roomNumber} ({viewingContract.room.property?.name})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Người thuê:</span>
                <span className="font-bold text-slate-900">
                  {viewingContract.tenant.user.fullName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Thời hạn:</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(viewingContract.startDate)} đến {formatDate(viewingContract.endDate)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Tiền thuê hàng tháng:</span>
                <span className="text-sm font-extrabold text-slate-900">
                  {formatCurrency(viewingContract.rentPrice)}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Tiền đặt cọc:</span>
                <span className="text-sm font-extrabold text-slate-900">
                  {formatCurrency(viewingContract.deposit)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-bold block mb-1.5 uppercase text-[11px] tracking-wider">
                Điều khoản hợp đồng:
              </span>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {viewingContract.terms || "Không có điều khoản bổ sung đặc biệt."}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingContract(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </FormModal>

      {/* Terminate confirmation */}
      <ConfirmDialog
        isOpen={!!terminateId}
        onClose={() => setTerminateId(null)}
        onConfirm={handleTerminate}
        title="Thanh lý hợp đồng"
        message="Bạn có chắc muốn thanh lý hợp đồng thuê này? Trạng thái phòng sẽ tự động chuyển sang Trống nếu phòng không còn người thuê khác."
        confirmText="Thanh lý"
        isDestructive
        isLoading={terminating}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa hợp đồng"
        message="Bạn có chắc chắn muốn xóa bản ghi hợp đồng này khỏi hệ thống?"
        isDestructive
        isLoading={deleting}
      />
    </div>
  );
}
