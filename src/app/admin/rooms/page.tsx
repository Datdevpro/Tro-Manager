"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  DoorOpen,
  Plus,
  Edit,
  Trash2,
  Filter,
  Eye,
  Building,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Droplet,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  // Form fields
  const [propertyId, setPropertyId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState(1);
  const [area, setArea] = useState(20);
  const [rentPrice, setRentPrice] = useState(3000000);
  const [electricPrice, setElectricPrice] = useState(3500);
  const [waterPrice, setWaterPrice] = useState(25000);
  const [deposit, setDeposit] = useState(3000000);
  const [maxOccupants, setMaxOccupants] = useState(2);
  const [status, setStatus] = useState("AVAILABLE");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // View detail modal
  const [viewingRoom, setViewingRoom] = useState<any>(null);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "10");
      if (search) params.set("search", search);
      if (selectedProperty) params.set("propertyId", selectedProperty);
      if (selectedStatus) params.set("status", selectedStatus);
      if (selectedFloor) params.set("floor", selectedFloor);

      const res = await fetch(`/api/rooms?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRooms(json.data.items);
        setTotalPages(json.data.totalPages);
        setTotalItems(json.data.total);
      }
    } catch {
      toast.error("Lỗi khi tải danh sách phòng");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedProperty, selectedStatus, selectedFloor]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Load properties for dropdown
  useEffect(() => {
    async function loadProps() {
      const res = await fetch("/api/properties");
      const json = await res.json();
      if (json.success) {
        setProperties(json.data);
        if (json.data.length > 0 && !propertyId) {
          setPropertyId(json.data[0].id);
          setElectricPrice(json.data[0].electricPrice ?? 3500);
          setWaterPrice(json.data[0].waterPrice ?? 25000);
        }
      }
    }
    loadProps();
  }, []);

  const handlePropertyChange = (newPropId: string) => {
    setPropertyId(newPropId);
    // When creating a new room, auto-fill electric and water prices from the selected property
    if (!editingRoom) {
      const selectedProp = properties.find((p) => p.id === newPropId);
      if (selectedProp) {
        setElectricPrice(selectedProp.electricPrice ?? 3500);
        setWaterPrice(selectedProp.waterPrice ?? 25000);
      }
    }
  };

  const openCreateModal = () => {
    setEditingRoom(null);
    const defaultProp = properties.length > 0 ? properties[0] : null;
    if (defaultProp) {
      setPropertyId(defaultProp.id);
      setElectricPrice(defaultProp.electricPrice ?? 3500);
      setWaterPrice(defaultProp.waterPrice ?? 25000);
    } else {
      setElectricPrice(3500);
      setWaterPrice(25000);
    }
    setRoomNumber("");
    setFloor(1);
    setArea(20);
    setRentPrice(3000000);
    setDeposit(3000000);
    setMaxOccupants(2);
    setStatus("AVAILABLE");
    setNote("");
    setIsModalOpen(true);
  };

  const openEditModal = (r: any) => {
    setEditingRoom(r);
    setPropertyId(r.propertyId);
    setRoomNumber(r.roomNumber);
    setFloor(r.floor);
    setArea(r.area);
    setRentPrice(r.rentPrice);
    setElectricPrice(r.electricPrice);
    setWaterPrice(r.waterPrice);
    setDeposit(r.deposit);
    setMaxOccupants(r.maxOccupants);
    setStatus(r.status);
    setNote(r.note || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim() || !propertyId) {
      toast.error("Vui lòng nhập số phòng và chọn khu trọ");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : "/api/rooms";
      const method = editingRoom ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          roomNumber,
          floor,
          area,
          rentPrice,
          electricPrice,
          waterPrice,
          deposit,
          maxOccupants,
          status,
          note,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setIsModalOpen(false);
        fetchRooms();
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
      const res = await fetch(`/api/rooms/${deleteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setDeleteId(null);
        fetchRooms();
      } else {
        toast.error(json.message || "Không thể xóa phòng");
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
        title="Quản lý Phòng trọ"
        description="Quản lý danh sách phòng, trạng thái sử dụng, giá thuê và thông tin khách thuê."
        icon={DoorOpen}
        actions={
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Thêm phòng mới
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Tìm theo số phòng (VD: P.101)..."
          className="w-full md:w-72"
        />

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Property filter */}
          <select
            value={selectedProperty}
            onChange={(e) => {
              setSelectedProperty(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Tất cả khu trọ</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="AVAILABLE">Phòng trống</option>
            <option value="OCCUPIED">Đang thuê</option>
            <option value="MAINTENANCE">Đang bảo trì</option>
          </select>

          {/* Floor filter */}
          <select
            value={selectedFloor}
            onChange={(e) => {
              setSelectedFloor(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Tất cả tầng</option>
            <option value="1">Tầng 1</option>
            <option value="2">Tầng 2</option>
            <option value="3">Tầng 3</option>
          </select>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Số phòng / Tầng</th>
                <th className="px-5 py-3.5">Khu trọ</th>
                <th className="px-5 py-3.5">Giá thuê / Cọc</th>
                <th className="px-5 py-3.5">Khách đang thuê</th>
                <th className="px-5 py-3.5">Đơn giá Điện / Nước</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    <LoadingSkeleton className="h-8 w-full mb-2" count={5} />
                  </td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <EmptyState
                      title="Không tìm thấy phòng nào"
                      description="Thử thay đổi bộ lọc hoặc thêm phòng mới vào danh sách."
                      icon={DoorOpen}
                    />
                  </td>
                </tr>
              ) : (
                rooms.map((r) => {
                  const activeTenant = r.tenants && r.tenants[0]?.user;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xs">
                            {r.roomNumber}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{r.roomNumber}</span>
                            <span className="text-[11px] text-slate-500">
                              Tầng {r.floor} • {r.area} m²
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-800 block truncate max-w-[150px]">
                          {r.property?.name}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block">
                          {formatCurrency(r.rentPrice)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Cọc: {formatCurrency(r.deposit)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {activeTenant ? (
                          <div>
                            <span className="font-semibold text-indigo-700 block">
                              {activeTenant.fullName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {activeTenant.phone || activeTenant.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa có khách</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>{formatCurrency(r.electricPrice)}/kWh</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] mt-0.5">
                          <Droplet className="w-3 h-3 text-blue-500" />
                          <span>{formatCurrency(r.waterPrice)}/m³</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingRoom(r)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                            title="Sửa phòng"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(r.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa phòng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            pageSize={10}
          />
        </div>
      </div>

      {/* Modal Add / Edit Room */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? "Chỉnh sửa phòng" : "Thêm phòng mới"}
        description="Nhập thông tin số phòng, tầng, diện tích và đơn giá điện nước."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Khu trọ *
              </label>
              <select
                required
                value={propertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Số phòng (VD: P.101, P.202) *
              </label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="P.101"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tầng
              </label>
              <input
                type="number"
                min={1}
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Diện tích (m²)
              </label>
              <input
                type="number"
                min={5}
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Số người tối đa
              </label>
              <input
                type="number"
                min={1}
                value={maxOccupants}
                onChange={(e) => setMaxOccupants(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Giá thuê phòng (VNĐ/tháng) *
              </label>
              <input
                type="number"
                min={0}
                required
                value={rentPrice}
                onChange={(e) => setRentPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
          </div>

          {/* Property rate hint banner */}
          {(() => {
            const currentProp = properties.find((p) => p.id === propertyId);
            return currentProp ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="text-slate-600">
                  Biểu giá chuẩn của <strong className="text-slate-900">{currentProp.name}</strong>: Điện{" "}
                  <strong className="text-amber-700">{formatCurrency(currentProp.electricPrice)}/kWh</strong>, Nước{" "}
                  <strong className="text-cyan-700">{formatCurrency(currentProp.waterPrice)}/m³</strong>
                </span>
                {(electricPrice !== currentProp.electricPrice || waterPrice !== currentProp.waterPrice) && (
                  <button
                    type="button"
                    onClick={() => {
                      setElectricPrice(currentProp.electricPrice ?? 3500);
                      setWaterPrice(currentProp.waterPrice ?? 25000);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold underline text-[11px] shrink-0 ml-2"
                  >
                    Dùng giá chuẩn khu trọ
                  </button>
                )}
              </div>
            ) : null;
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Đơn giá Điện (VNĐ/kWh)
              </label>
              <input
                type="number"
                min={0}
                value={electricPrice}
                onChange={(e) => setElectricPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Đơn giá Nước (VNĐ/m³)
              </label>
              <input
                type="number"
                min={0}
                value={waterPrice}
                onChange={(e) => setWaterPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Trạng thái phòng
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="AVAILABLE">Phòng trống (AVAILABLE)</option>
                <option value="OCCUPIED">Đang thuê (OCCUPIED)</option>
                <option value="MAINTENANCE">Bảo trì sửa chữa (MAINTENANCE)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ghi chú thêm
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Ban công thoáng, có sẵn máy lạnh"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              {submitting ? "Đang lưu..." : editingRoom ? "Lưu thay đổi" : "Tạo phòng"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* View Detail Modal */}
      <FormModal
        isOpen={!!viewingRoom}
        onClose={() => setViewingRoom(null)}
        title={`Chi tiết ${viewingRoom?.roomNumber}`}
        description="Thông tin toàn diện phòng trọ và khách đang thuê"
        maxWidth="lg"
      >
        {viewingRoom && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-500 block">Khu trọ:</span>
                <span className="text-sm font-bold text-slate-900">
                  {viewingRoom.property?.name}
                </span>
              </div>
              <StatusBadge status={viewingRoom.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                <span className="text-slate-400 block mb-1">Giá thuê hàng tháng:</span>
                <span className="text-base font-extrabold text-indigo-600">
                  {formatCurrency(viewingRoom.rentPrice)}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                <span className="text-slate-400 block mb-1">Tiền cọc giữ phòng:</span>
                <span className="text-base font-extrabold text-slate-800">
                  {formatCurrency(viewingRoom.deposit)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tầng & Diện tích:</span>
                <span className="font-semibold text-slate-800">
                  Tầng {viewingRoom.floor} • {viewingRoom.area} m² (Tối đa {viewingRoom.maxOccupants} người)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đơn giá Điện:</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(viewingRoom.electricPrice)} / kWh
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đơn giá Nước:</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(viewingRoom.waterPrice)} / m³
                </span>
              </div>
              {viewingRoom.note && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Ghi chú:</span>
                  <p className="text-slate-700 italic">{viewingRoom.note}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl">
              <h4 className="font-bold text-slate-900 mb-2">Khách thuê hiện tại:</h4>
              {viewingRoom.tenants && viewingRoom.tenants.length > 0 ? (
                <div className="space-y-1">
                  <p className="font-semibold text-indigo-900 text-sm">
                    {viewingRoom.tenants[0].user.fullName}
                  </p>
                  <p className="text-slate-600">SĐT: {viewingRoom.tenants[0].user.phone || "Chưa cập nhật"}</p>
                  <p className="text-slate-600">Email: {viewingRoom.tenants[0].user.email}</p>
                </div>
              ) : (
                <p className="text-slate-500 italic">Phòng này hiện đang chưa có người thuê.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingRoom(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 transition"
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
        title="Xóa phòng trọ"
        message="Bạn có chắc chắn muốn xóa phòng này không? Hệ thống sẽ chặn thao tác nếu phòng đang có hợp đồng hoạt động."
        isDestructive
        isLoading={deleting}
      />
    </div>
  );
}
