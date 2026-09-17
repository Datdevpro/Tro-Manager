"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  Home,
  CreditCard,
  FileText,
  Calendar,
  MapPin,
  Shield,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Create / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("Nam");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [roomId, setRoomId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // View detail modal
  const [viewingTenant, setViewingTenant] = useState<any>(null);

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "10");
      if (search) params.set("search", search);

      const res = await fetch(`/api/tenants?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTenants(json.data.items);
        setTotalPages(json.data.totalPages);
        setTotalItems(json.data.total);
      }
    } catch {
      toast.error("Lỗi khi tải danh sách người thuê");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Load available rooms for assignment
  useEffect(() => {
    async function loadRooms() {
      const res = await fetch("/api/rooms?pageSize=100");
      const json = await res.json();
      if (json.success) {
        setRooms(json.data.items);
      }
    }
    loadRooms();
  }, []);

  const openCreateModal = () => {
    setEditingTenant(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setIdNumber("");
    setBirthday("");
    setGender("Nam");
    setPermanentAddress("");
    setRoomId("");
    setIsModalOpen(true);
  };

  const openEditModal = (t: any) => {
    setEditingTenant(t);
    setFullName(t.user.fullName);
    setEmail(t.user.email);
    setPhone(t.user.phone || "");
    setIdNumber(t.idNumber || "");
    setBirthday(t.birthday ? t.birthday.split("T")[0] : "");
    setGender(t.gender || "Nam");
    setPermanentAddress(t.permanentAddress || "");
    setRoomId(t.roomId || "");
    setIsModalOpen(true);
  };

  const openViewModal = async (t: any) => {
    try {
      const res = await fetch(`/api/tenants/${t.id}`);
      const json = await res.json();
      if (json.success) {
        setViewingTenant(json.data);
      } else {
        setViewingTenant(t);
      }
    } catch {
      setViewingTenant(t);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Vui lòng nhập họ tên và email");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingTenant ? `/api/tenants/${editingTenant.id}` : "/api/tenants";
      const method = editingTenant ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          idNumber,
          birthday: birthday || undefined,
          gender,
          permanentAddress,
          roomId: roomId || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setIsModalOpen(false);
        fetchTenants();
      } else {
        toast.error(json.message || "Thao tác không thành công");
      }
    } catch {
      toast.error("Lỗi hệ thống");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/tenants/${deleteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setDeleteId(null);
        fetchTenants();
      } else {
        toast.error(json.message || "Không thể xóa người thuê");
      }
    } catch {
      toast.error("Lỗi khi xóa");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Người thuê"
        description="Quản lý hồ sơ cư dân, hợp đồng thuê phòng, số định danh CCCD và lịch sử thanh toán."
        icon={Users}
        actions={
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Thêm người thuê mới
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Tìm tên, SĐT, Email hoặc CCCD..."
          className="w-full md:w-80"
        />
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Tổng cộng: <span className="font-bold text-slate-800 dark:text-slate-200">{totalItems}</span> người thuê
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Khách thuê</th>
                <th className="px-5 py-3.5">Liên hệ</th>
                <th className="px-5 py-3.5">Số CCCD</th>
                <th className="px-5 py-3.5">Phòng đang ở</th>
                <th className="px-5 py-3.5">Ngày bắt đầu</th>
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
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <EmptyState
                      title="Chưa có người thuê"
                      description="Thêm hồ sơ người thuê đầu tiên hoặc đổi từ khóa tìm kiếm."
                      icon={Users}
                    />
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {t.user.fullName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{t.user.fullName}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t.gender || "Chưa rõ"}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                          <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>{t.user.phone || "--"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span className="truncate max-w-[150px]">{t.user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {t.idNumber || <span className="text-slate-400 dark:text-slate-500 italic font-sans">Chưa có</span>}
                    </td>

                    <td className="px-5 py-4">
                      {t.room ? (
                        <div>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
                            {t.room.roomNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t.room.property?.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">Chưa gán phòng</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-medium">
                      {formatDate(t.startDate)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Đang thuê
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openViewModal(t)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Hồ sơ chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Sửa thông tin"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          title="Xóa hồ sơ"
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

      {/* Modal Add / Edit Tenant */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTenant ? "Chỉnh sửa người thuê" : "Thêm người thuê mới"}
        description="Thông tin cá nhân, CCCD và phòng trọ bố trí cho khách thuê"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Họ và tên *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn An"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Email đăng nhập *
              </label>
              <input
                type="email"
                required
                disabled={!!editingTenant}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nguyenvanan@nhatro.local"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Số điện thoại
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Số CCCD / CMND
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="079095012345"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Giới tính
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Ngày sinh
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Gán phòng / Chuyển phòng
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
              >
                <option value="">-- Chưa gán phòng --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} ({r.property?.name}) - {formatCurrency(r.rentPrice)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Địa chỉ thường trú (theo CCCD)
            </label>
            <input
              type="text"
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
              placeholder="Xã/Phường, Huyện/Quận, Tỉnh/Thành phố"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
            />
          </div>

          {!editingTenant && (
            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-xs text-indigo-800 dark:text-indigo-300">
              Mật khẩu mặc định khởi tạo cho tài khoản khách thuê là:{" "}
              <span className="font-bold">User123!</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
              {submitting ? "Đang lưu..." : editingTenant ? "Lưu hồ sơ" : "Tạo khách thuê"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* View Full Tenant Profile Modal */}
      <FormModal
        isOpen={!!viewingTenant}
        onClose={() => setViewingTenant(null)}
        title="Hồ sơ Cư Dân Chi Tiết"
        description="Thông tin cá nhân, phòng thuê, hợp đồng và lịch sử hóa đơn"
        maxWidth="2xl"
      >
        {viewingTenant && (
          <div className="space-y-5 text-xs">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-indigo-600/20">
                {viewingTenant.user?.fullName?.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {viewingTenant.user?.fullName}
                </h3>
                <p className="text-slate-500 dark:text-slate-400">{viewingTenant.user?.email} • {viewingTenant.user?.phone || "Chưa có SĐT"}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Phòng hiện tại:</span>
                <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                  {viewingTenant.room ? viewingTenant.room.roomNumber : "Chưa ở phòng nào"}
                </span>
              </div>
            </div>

            {/* General details */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Số định danh CCCD:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {viewingTenant.idNumber || "Chưa cập nhật"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Ngày sinh & Giới tính:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {formatDate(viewingTenant.birthday)} ({viewingTenant.gender || "Khác"})
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block">Địa chỉ thường trú:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingTenant.permanentAddress || "Chưa cập nhật"}
                </span>
              </div>
            </div>

            {/* Contracts List */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Lịch sử hợp đồng thuê ({viewingTenant.contracts?.length || 0})
              </h4>
              {viewingTenant.contracts?.length > 0 ? (
                <div className="space-y-2">
                  {viewingTenant.contracts.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          Phòng {c.room?.roomNumber || "Phòng"} • {formatCurrency(c.rentPrice)}/tháng
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {formatDate(c.startDate)} - {formatDate(c.endDate)}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 dark:text-slate-500 italic">Chưa có hợp đồng nào.</p>
              )}
            </div>

            {/* Invoices List */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Hóa đơn gần nhất ({viewingTenant.invoices?.length || 0})
              </h4>
              {viewingTenant.invoices?.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {viewingTenant.invoices.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          Tháng {inv.month} • {formatCurrency(inv.total)}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Hạn đóng: {formatDate(inv.dueDate)}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          inv.status === "PAID"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {inv.status === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 dark:text-slate-500 italic">Chưa có hóa đơn nào.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingTenant(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </FormModal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa hồ sơ người thuê"
        message="Bạn có chắc muốn xóa hồ sơ này? Hệ thống sẽ ngăn chặn nếu người thuê đang có hợp đồng hoặc hóa đơn chưa thanh toán."
        isDestructive
        isLoading={deleting}
      />
    </div>
  );
}
