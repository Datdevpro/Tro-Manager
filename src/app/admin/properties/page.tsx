"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building,
  Plus,
  Edit,
  Trash2,
  MapPin,
  DoorOpen,
  Users,
  CheckCircle2,
  AlertCircle,
  Zap,
  Droplets,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface PropertyItem {
  id: string;
  name: string;
  address: string;
  description: string | null;
  electricPrice: number;
  waterPrice: number;
  servicesCount: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  totalTenants: number;
  createdAt: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyItem | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [electricPrice, setElectricPrice] = useState("3500");
  const [waterPrice, setWaterPrice] = useState("25000");
  const [syncRooms, setSyncRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/properties");
      const json = await res.json();
      if (json.success) {
        setProperties(json.data);
      } else {
        toast.error(json.message);
      }
    } catch {
      toast.error("Lỗi khi tải danh sách khu trọ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const openCreateModal = () => {
    setEditingProperty(null);
    setName("");
    setAddress("");
    setDescription("");
    setElectricPrice("3500");
    setWaterPrice("25000");
    setSyncRooms(false);
    setIsModalOpen(true);
  };

  const openEditModal = (prop: PropertyItem) => {
    setEditingProperty(prop);
    setName(prop.name);
    setAddress(prop.address);
    setDescription(prop.description || "");
    setElectricPrice(String(prop.electricPrice ?? 3500));
    setWaterPrice(String(prop.waterPrice ?? 25000));
    setSyncRooms(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error("Vui lòng nhập tên khu trọ và địa chỉ");
      return;
    }

    const numElec = parseFloat(electricPrice);
    const numWater = parseFloat(waterPrice);
    if (isNaN(numElec) || numElec < 0 || isNaN(numWater) || numWater < 0) {
      toast.error("Đơn giá điện và nước phải là số hợp lệ và không âm");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingProperty
        ? `/api/properties/${editingProperty.id}`
        : "/api/properties";
      const method = editingProperty ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          description,
          electricPrice: numElec,
          waterPrice: numWater,
          syncRooms,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setIsModalOpen(false);
        fetchProperties();
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
      const res = await fetch(`/api/properties/${deleteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setDeleteId(null);
        fetchProperties();
      } else {
        toast.error(json.message || "Không thể xóa khu trọ");
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
        title="Quản lý Khu trọ & Tòa nhà"
        description="Quản lý thông tin các tòa nhà, cài đặt đơn giá điện, nước và dịch vụ riêng cho từng khu trọ."
        icon={Building}
        actions={
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Thêm khu trọ mới
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingSkeleton className="h-64 rounded-2xl" count={2} />
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          title="Chưa có khu trọ nào"
          description="Bắt đầu quản lý bằng cách thêm khu trọ đầu tiên của bạn vào hệ thống."
          icon={Building}
          action={
            <button
              onClick={openCreateModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
            >
              Thêm khu trọ
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {prop.name}
                      </h3>
                      <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span className="truncate">{prop.address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(prop)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Sửa thông tin & đơn giá"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(prop.id)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                      title="Xóa khu trọ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {prop.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 line-clamp-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    {prop.description}
                  </p>
                )}

                {/* Utility Pricing Badges for Property */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/70 border border-amber-100/80">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block">
                        Giá điện
                      </span>
                      <span className="text-xs font-bold text-amber-900 truncate block">
                        {formatCurrency(prop.electricPrice)}/kWh
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-cyan-50/70 border border-cyan-100/80">
                    <Droplets className="w-4 h-4 text-cyan-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-cyan-700 tracking-wider block">
                        Giá nước
                      </span>
                      <span className="text-xs font-bold text-cyan-900 truncate block">
                        {formatCurrency(prop.waterPrice)}/m³
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/admin/services?propertyId=${prop.id}`}
                    className="flex items-center gap-2 p-2 rounded-xl bg-purple-50/70 border border-purple-100/80 hover:bg-purple-100/70 transition group"
                    title="Xem các dịch vụ của khu trọ này"
                  >
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider block">
                        Dịch vụ
                      </span>
                      <span className="text-xs font-bold text-purple-900 truncate block group-hover:underline">
                        {prop.servicesCount || 0} dịch vụ
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Tổng phòng</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{prop.totalRooms}</span>
                </div>
                <div className="bg-blue-50/60 dark:bg-blue-950/40 rounded-xl p-2">
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 block font-medium">Đang thuê</span>
                  <span className="text-base font-bold text-blue-700 dark:text-blue-300">{prop.occupiedRooms}</span>
                </div>
                <div className="bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl p-2">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-medium">Phòng trống</span>
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">{prop.availableRooms}</span>
                </div>
                <div className="bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl p-2">
                  <span className="text-[11px] text-indigo-700 dark:text-indigo-300 block font-medium">Khách ở</span>
                  <span className="text-base font-bold text-indigo-700 dark:text-indigo-300">{prop.totalTenants}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProperty ? "Chỉnh sửa khu trọ & Biểu giá" : "Thêm khu trọ mới"}
        description="Thiết lập thông tin khu trọ và biểu giá điện, nước áp dụng cho khu trọ này."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tên khu trọ / Tòa nhà *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Khu Trọ An Cư 1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Địa chỉ chi tiết *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>

          {/* Electric & Water Prices */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Biểu giá điện & nước riêng của khu trọ
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Đơn giá điện (đ/kWh) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={electricPrice}
                  onChange={(e) => setElectricPrice(e.target.value)}
                  placeholder="VD: 3500"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  Đơn giá nước (đ/m³) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  value={waterPrice}
                  onChange={(e) => setWaterPrice(e.target.value)}
                  placeholder="VD: 25000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {editingProperty && (
              <label className="flex items-start gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncRooms}
                  onChange={(e) => setSyncRooms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    Đồng bộ giá điện & nước này cho toàn bộ phòng hiện có
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                    Cập nhật đồng loạt đơn giá mới cho {editingProperty.totalRooms} phòng thuộc khu trọ này.
                  </p>
                </div>
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Mô tả & Tiện ích
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tiện nghi tòa nhà: thang máy, camera, giờ giấc tự do..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
              {submitting ? "Đang lưu..." : editingProperty ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa khu trọ"
        message="Bạn có chắc chắn muốn xóa khu trọ này không? Hệ thống sẽ ngăn chặn nếu khu trọ còn phòng đang có hợp đồng thuê hoạt động."
        isDestructive
        isLoading={deleting}
      />
    </div>
  );
}
