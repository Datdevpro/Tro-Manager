"use client";

import React, { useEffect, useState } from "react";
import { Building, Plus, Edit, Trash2, MapPin, DoorOpen, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { toast } from "sonner";

interface PropertyItem {
  id: string;
  name: string;
  address: string;
  description: string | null;
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
    setIsModalOpen(true);
  };

  const openEditModal = (prop: PropertyItem) => {
    setEditingProperty(prop);
    setName(prop.name);
    setAddress(prop.address);
    setDescription(prop.description || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error("Vui lòng nhập tên khu trọ và địa chỉ");
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
        body: JSON.stringify({ name, address, description }),
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
        description="Quản lý thông tin các tòa nhà, chung cư mini, dãy trọ cho thuê."
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
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {prop.name}
                      </h3>
                      <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{prop.address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(prop)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                      title="Sửa thông tin"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(prop.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Xóa khu trọ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {prop.description && (
                  <p className="text-xs text-slate-600 mt-4 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {prop.description}
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 pt-5 mt-5 border-t border-slate-100 text-center">
                <div className="bg-slate-50 rounded-xl p-2">
                  <span className="text-[11px] text-slate-500 block">Tổng phòng</span>
                  <span className="text-base font-bold text-slate-900">{prop.totalRooms}</span>
                </div>
                <div className="bg-blue-50/60 rounded-xl p-2">
                  <span className="text-[11px] text-blue-600 block font-medium">Đang thuê</span>
                  <span className="text-base font-bold text-blue-700">{prop.occupiedRooms}</span>
                </div>
                <div className="bg-emerald-50/60 rounded-xl p-2">
                  <span className="text-[11px] text-emerald-600 block font-medium">Phòng trống</span>
                  <span className="text-base font-bold text-emerald-700">{prop.availableRooms}</span>
                </div>
                <div className="bg-indigo-50/60 rounded-xl p-2">
                  <span className="text-[11px] text-indigo-600 block font-medium">Khách ở</span>
                  <span className="text-base font-bold text-indigo-700">{prop.totalTenants}</span>
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
        title={editingProperty ? "Chỉnh sửa khu trọ" : "Thêm khu trọ mới"}
        description="Điền thông tin chi tiết về khu nhà trọ hoặc căn hộ cho thuê"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên khu trọ / Tòa nhà *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Khu Trọ An Cư 1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Địa chỉ chi tiết *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
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
