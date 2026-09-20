"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Plus,
  Send,
  Users,
  Building,
  DoorOpen,
  User,
  Clock,
  CheckCheck,
  Inbox,
  Loader2,
  Sparkles,
} from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal Create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState("ALL");
  const [targetId, setTargetId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Targets
  const [properties, setProperties] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotifications(json.data);
      }
    } catch {
      // Quiet fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const openCreateModal = async () => {
    setTitle("");
    setContent("");
    setTargetType("ALL");
    setTargetId("");
    setIsOpen(false);
    setIsModalOpen(true);

    try {
      const [pRes, rRes, tRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/rooms?pageSize=100"),
        fetch("/api/tenants?pageSize=100"),
      ]);
      const [pJson, rJson, tJson] = await Promise.all([pRes.json(), rRes.json(), tRes.json()]);
      if (pJson.success) setProperties(pJson.data);
      if (rJson.success) setRooms(rJson.data.items);
      if (tJson.success) setTenants(tJson.data.items);
    } catch {
      // Quiet fail
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          targetType,
          targetId: targetType === "ALL" ? null : targetId,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Đã phát thông báo thành công!");
        setIsModalOpen(false);
        fetchNotifications();
      } else {
        toast.error(json.message || "Không thể gửi thông báo");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Icon Chuông */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        title="Thông báo hệ thống"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
        )}
      </button>

      {/* Popover Dropdown Thông Báo */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Thông báo ({notifications.length})
              </span>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo mới
            </button>
          </div>

          {/* List content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                <span>Đang tải thông báo...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <span>Chưa có thông báo nào được gửi.</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        n.targetType === "ALL"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                          : n.targetType === "PROPERTY"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : n.targetType === "ROOM"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {n.targetType === "ALL"
                        ? "Tất cả cư dân"
                        : n.targetType === "PROPERTY"
                        ? "Theo khu trọ"
                        : n.targetType === "ROOM"
                        ? "Theo phòng"
                        : "Cá nhân"}
                    </span>

                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(n.createdAt)}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-white text-xs pt-0.5">
                    {n.title}
                  </h4>

                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                    {n.content}
                  </p>

                  <div className="pt-1 text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã có {n.reads?.length || 0} cư dân đọc</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Tạo Thông Báo Mới */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Gửi Thông Báo Mới Đến Cư Dân"
        description="Thông báo sẽ xuất hiện ngay lập tức trên thanh menu và cổng thông tin của cư dân."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Đối tượng nhận thông báo *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { type: "ALL", label: "Tất cả cư dân", icon: Users },
                { type: "PROPERTY", label: "Theo khu trọ", icon: Building },
                { type: "ROOM", label: "Theo phòng", icon: DoorOpen },
                { type: "USER", label: "Một người", icon: User },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = targetType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setTargetType(item.type);
                      setTargetId("");
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border font-semibold transition ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chọn targetId nếu không phải ALL */}
          {targetType === "PROPERTY" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Chọn khu trọ *
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950 font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="">-- Chọn khu trọ cần gửi --</option>
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Chọn phòng *
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950 font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="">-- Chọn phòng cần gửi --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Phòng {r.roomNumber} ({r.property?.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === "USER" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Chọn cư dân *
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950 font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="">-- Chọn người nhận --</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.userId}>
                    {t.user?.fullName} ({t.room?.roomNumber ? `Phòng ${t.room.roomNumber}` : "Chưa gán"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tiêu đề thông báo *
            </label>
            <input
              type="text"
              placeholder="VD: Nhắc hạn nộp tiền phòng tháng này, Lịch cắt điện..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950 font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nội dung thông báo *
            </label>
            <textarea
              rows={4}
              placeholder="Nhập nội dung thông tin chi tiết gửi tới cư dân..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white resize-none"
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
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? "Đang phát..." : "Phát thông báo ngay"}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
