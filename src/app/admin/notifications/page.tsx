"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  Plus,
  Send,
  Users,
  Building,
  DoorOpen,
  User,
  CheckCheck,
  Clock,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormModal } from "@/components/ui/FormModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState("ALL");
  const [targetId, setTargetId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch {
      toast.error("Lỗi khi tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Load target lists
  useEffect(() => {
    async function loadTargets() {
      const [pRes, rRes, tRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/rooms?pageSize=100"),
        fetch("/api/tenants?pageSize=100"),
      ]);
      const [pJson, rJson, tJson] = await Promise.all([pRes.json(), rRes.json(), tRes.json()]);
      if (pJson.success) setProperties(pJson.data);
      if (rJson.success) setRooms(rJson.data.items);
      if (tJson.success) setUsers(tJson.data.items);
    }
    loadTargets();
  }, []);

  const openCreateModal = () => {
    setTitle("");
    setContent("");
    setTargetType("ALL");
    setTargetId("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung thông báo");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          targetType,
          targetId: targetType === "ALL" ? null : targetId,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Gửi thông báo thành công!");
        setIsModalOpen(false);
        fetchNotifications();
      } else {
        toast.error(json.message || "Lỗi gửi thông báo");
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
        title="Quản lý Thông báo"
        description="Phát thông báo bảo trì, tiền phòng, nội quy cư xá tới toàn bộ cư dân hoặc từng phòng/khu trọ."
        icon={Bell}
        actions={
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Gửi thông báo mới
          </button>
        }
      />

      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton className="h-24 rounded-2xl" count={3} />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="Chưa có thông báo nào"
          description="Bấm 'Gửi thông báo mới' để thông tin các sự kiện, hạn nộp tiền đến cư dân."
          icon={Bell}
          action={
            <button
              onClick={openCreateModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
            >
              Soạn thông báo
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => {
            let targetLabel = "Tất cả cư dân (Toàn hệ thống)";
            let badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";

            if (n.targetType === "PROPERTY") {
              targetLabel = "Theo khu trọ";
              badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
            } else if (n.targetType === "ROOM") {
              targetLabel = "Theo phòng cụ thể";
              badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
            } else if (n.targetType === "USER") {
              targetLabel = "Đích danh người thuê";
              badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
            }

            return (
              <div
                key={n.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
                    >
                      {targetLabel}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    <span>Đã đọc: {n.reads?.length || 0} người</span>
                  </div>
                </div>

                <div className="pt-3">
                  <h3 className="font-bold text-slate-900 text-base mb-1">{n.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {n.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Send Notification */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Soạn & Gửi Thông Báo Mới"
        description="Gửi tin nhắn thông báo đến trang cá nhân của người thuê"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Phạm vi người nhận *
            </label>
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setTargetId("");
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
            >
              <option value="ALL">Tất cả cư dân (Toàn hệ thống)</option>
              <option value="PROPERTY">Chỉ gửi cho một Khu trọ</option>
              <option value="ROOM">Chỉ gửi cho một Phòng cụ thể</option>
              <option value="USER">Chỉ gửi đích danh một Người thuê</option>
            </select>
          </div>

          {/* Sub Target Dropdown */}
          {targetType === "PROPERTY" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Chọn khu trọ nhận tin *
              </label>
              <select
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">-- Chọn khu trọ --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === "ROOM" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Chọn phòng nhận tin *
              </label>
              <select
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">-- Chọn phòng --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} ({r.property?.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === "USER" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Chọn người thuê nhận tin *
              </label>
              <select
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">-- Chọn khách thuê --</option>
                {users.map((t) => (
                  <option key={t.user.id} value={t.user.id}>
                    {t.user.fullName} ({t.user.phone || t.user.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tiêu đề thông báo *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Nhắc hạn đóng tiền phòng tháng 09/2026..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nội dung thông báo *
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nội dung thông tin chi tiết..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
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
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? "Đang gửi..." : "Gửi thông báo"}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
