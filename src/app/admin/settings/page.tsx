"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  KeyRound,
  Building,
  CheckCircle2,
  UserCheck,
  Palette,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTheme } from "@/components/theme/ThemeProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới xác nhận không khớp");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Đổi mật khẩu tài khoản Admin thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(json.message || "Lỗi đổi mật khẩu");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const themeOptions = [
    {
      id: "light",
      name: "Giao diện Sáng",
      description: "Nền trắng thanh lịch, tương phản rõ ràng",
      icon: Sun,
      iconColor: "text-amber-500",
      previewBg: "bg-slate-50 border-slate-200",
      previewBar: "bg-indigo-600",
    },
    {
      id: "dark",
      name: "Giao diện Tối",
      description: "Tông màu đêm dịu mắt, giảm mỏi mắt khi làm việc ban đêm",
      icon: Moon,
      iconColor: "text-indigo-400",
      previewBg: "bg-slate-900 border-slate-700",
      previewBar: "bg-indigo-500",
    },
    {
      id: "system",
      name: "Theo Hệ Thống",
      description: "Tự động đồng bộ với giao diện của thiết bị hoặc trình duyệt",
      icon: Laptop,
      iconColor: "text-emerald-500",
      previewBg: "bg-linear-to-r from-slate-100 to-slate-850 border-slate-300 dark:border-slate-700",
      previewBar: "bg-indigo-600",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Cài đặt Hệ thống & Giao diện"
        description="Quản lý thông tin quản trị viên, bảo mật tài khoản và chế độ hiển thị nền (Dark/Light)."
        icon={Settings}
      />

      {/* Appearance Settings Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Chế độ hiển thị & Màu nền (Appearance)
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Tùy chỉnh giao diện hiển thị cho bảng quản trị. Lựa chọn sẽ được lưu tự động trên trình duyệt này.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id as any);
                  toast.success(`Đã chuyển sang ${opt.name}`);
                }}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between group",
                  isSelected
                    ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                {/* Mini mock preview */}
                <div
                  className={cn(
                    "w-full h-16 rounded-xl border mb-3 p-2 flex flex-col justify-between overflow-hidden shadow-inner",
                    opt.previewBg
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className={cn("w-12 h-2 rounded-full", opt.previewBar)} />
                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="w-3/4 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-1/2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>

                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", opt.iconColor)} />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {opt.name}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs text-center transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-600/20">
              AD
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Ban Quản Trị</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mt-1">
              Role: ADMIN
            </span>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-left text-xs space-y-2">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Email đăng nhập:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">admin@nhatro.local</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Quyền hạn:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Toàn quyền hệ thống</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Đổi mật khẩu Quản trị
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Cập nhật mật khẩu để bảo vệ an toàn cho cổng quản lý nhà trọ.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Mật khẩu hiện tại *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Admin123!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Mật khẩu mới *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Xác nhận mật khẩu mới *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Khớp với mật khẩu mới"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

