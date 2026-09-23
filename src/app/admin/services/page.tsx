"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Building,
  Globe,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const calculationTypeLabels: Record<string, string> = {
  PER_ROOM: "Theo từng phòng (/phòng/tháng)",
  PER_PERSON: "Theo đầu người (/người/tháng)",
  FIXED: "Cố định trọn gói",
  QUANTITY: "Theo số lượng thực tế (chiếc/vé)",
};

interface PropertyOption {
  id: string;
  name: string;
}

interface ServiceItem {
  id: string;
  propertyId: string | null;
  name: string;
  price: number;
  calculationType: string;
  description: string | null;
  property?: { id: string; name: string } | null;
  _count?: { roomServices: number };
}

function ServicesContent() {
  const searchParams = useSearchParams();
  const initialPropId = searchParams.get("propertyId") || "all";

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>(initialPropId);
  const [loading, setLoading] = useState(true);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState(100000);
  const [calculationType, setCalculationType] = useState("PER_ROOM");
  const [propertyId, setPropertyId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch properties for selector and filter
  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/properties");
      const json = await res.json();
      if (json.success) {
        setProperties(json.data);
      }
    } catch {
      // silently ignore or notify
    }
  };

  const fetchServices = async (filterPropId = selectedPropertyFilter) => {
    try {
      setLoading(true);
      const query = filterPropId && filterPropId !== "all" ? `?propertyId=${filterPropId}` : "";
      const res = await fetch(`/api/services${query}`);
      const json = await res.json();
      if (json.success) {
        setServices(json.data);
      }
    } catch {
      toast.error("Lỗi khi tải danh sách dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchServices(selectedPropertyFilter);
  }, [selectedPropertyFilter]);

  const openCreateModal = () => {
    setEditingService(null);
    setName("");
    setPrice(50000);
    setCalculationType("PER_ROOM");
    // Pre-select current property filter if a specific property is filtered
    setPropertyId(
      selectedPropertyFilter !== "all" && selectedPropertyFilter !== "global"
        ? selectedPropertyFilter
        : ""
    );
    setDescription("");
    setIsModalOpen(true);
  };

  const openEditModal = (s: ServiceItem) => {
    setEditingService(s);
    setName(s.name);
    setPrice(s.price);
    setCalculationType(s.calculationType);
    setPropertyId(s.propertyId || "");
    setDescription(s.description || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên dịch vụ");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingService ? `/api/services/${editingService.id}` : "/api/services";
      const method = editingService ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price,
          calculationType,
          propertyId: propertyId || null,
          description,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setIsModalOpen(false);
        fetchServices(selectedPropertyFilter);
      } else {
        toast.error(json.message || "Lỗi lưu dịch vụ");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/services/${deleteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setDeleteId(null);
        fetchServices(selectedPropertyFilter);
      } else {
        toast.error(json.message || "Không thể xóa dịch vụ");
      }
    } catch {
      toast.error("Lỗi xóa");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Dịch vụ & Tiện ích"
        description="Định cấu hình các dịch vụ gia tăng như Wifi, Gửi xe, Rác, Thang máy, Dọn dẹp riêng cho từng khu trọ hoặc dùng chung toàn hệ thống."
        icon={Layers}
        actions={
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Thêm dịch vụ mới
          </button>
        }
      />

      {/* Filter by Property */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Lọc theo khu trọ:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedPropertyFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedPropertyFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả dịch vụ
          </button>

          <button
            type="button"
            onClick={() => setSelectedPropertyFilter("global")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
              selectedPropertyFilter === "global"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Dùng chung toàn bộ
          </button>

          {properties.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPropertyFilter(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                selectedPropertyFilter === p.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingSkeleton className="h-48 rounded-2xl" count={3} />
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          title="Chưa có dịch vụ nào"
          description="Tạo các dịch vụ tính phí như Wifi, Gửi xe, Thu gom rác cho khu trọ này."
          icon={Layers}
          action={
            <button
              onClick={openCreateModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
            >
              Thêm dịch vụ
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{s.name}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                          {calculationTypeLabels[s.calculationType] || s.calculationType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(s.id)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                      title="Xóa dịch vụ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Property Association Badge */}
                <div className="mb-3">
                  {s.property ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
                      <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">{s.property.name}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span>Áp dụng chung toàn hệ thống</span>
                    </span>
                  )}
                </div>

                <div className="mt-2 mb-2">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(s.price)}
                  </span>
                </div>

                {s.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    {s.description}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Số phòng áp dụng:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {s._count?.roomServices || 0} phòng
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Service */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? "Chỉnh sửa dịch vụ" : "Tạo dịch vụ mới"}
        description="Đơn giá và phạm vi áp dụng dịch vụ cho từng khu trọ"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tên dịch vụ *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Internet Cáp Quang, Gửi xe máy, Rác..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Property Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Áp dụng cho khu trọ
            </label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
            >
              <option value="">🌐 Dùng chung (Tất cả khu trọ đều dùng được)</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  🏢 {p.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {propertyId
                ? "Dịch vụ này chỉ hiển thị và áp dụng cho các phòng thuộc khu trọ đã chọn."
                : "Dịch vụ dùng chung có thể được gán cho bất kỳ phòng nào trong hệ thống."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Đơn giá (VNĐ) *
              </label>
              <input
                type="number"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Cách thức tính phí
              </label>
              <select
                value={calculationType}
                onChange={(e) => setCalculationType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="PER_ROOM">Theo từng phòng (PER_ROOM)</option>
                <option value="PER_PERSON">Theo đầu người (PER_PERSON)</option>
                <option value="FIXED">Cố định trọn gói (FIXED)</option>
                <option value="QUANTITY">Theo số lượng (QUANTITY)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Mô tả chi tiết
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả phạm vi dịch vụ, chất lượng cam kết..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
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
              {submitting ? "Đang lưu..." : editingService ? "Cập nhật" : "Tạo dịch vụ"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa dịch vụ"
        message="Bạn có chắc chắn muốn xóa dịch vụ này không? Dịch vụ sẽ bị hủy liên kết khỏi các phòng."
        isDestructive
        isLoading={deleting}
      />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="p-6">Đang tải danh sách dịch vụ...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
