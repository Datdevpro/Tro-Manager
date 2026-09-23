"use client";

import React, { useEffect, useState } from "react";
import { User, Lock, Phone, Mail, Shield, KeyRound, Building, DoorOpen } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function TenantProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form edit profile
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Form change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tenant/profile");
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
        setFullName(json.data.fullName);
        setPhone(json.data.phone || "");
        setAvatarUrl(json.data.avatarUrl || "");
      }
    } catch {
      toast.error("Lỗi khi tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await fetch("/api/tenant/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, avatarUrl }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Cập nhật thông tin thành công!");
        fetchProfile();
      } else {
        toast.error(json.message || "Lỗi cập nhật");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSavingProfile(false);
    }
  };

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
      setChangingPass(true);
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Đổi mật khẩu thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(json.message || "Không thể đổi mật khẩu");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setChangingPass(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-48 rounded-3xl" count={2} />
      </div>
    );
  }

  const room = profile.tenant?.room;

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Hồ sơ & Tài khoản của tôi"
        description="Quản lý thông tin liên hệ cá nhân và bảo mật tài khoản cư dân."
        icon={User}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Read-only rental info */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs text-center transition-colors">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 border-2 border-emerald-300 dark:border-emerald-700">
              {profile.fullName.charAt(0)}
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">{profile.fullName}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mt-1">
              Khách thuê (Cư dân)
            </span>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-left text-xs space-y-2.5">
              <div>
                <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Email đăng nhập (Cố định):</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{profile.email}</span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Quyền hạn hệ thống:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">USER (Khách thuê)</span>
              </div>
            </div>
          </div>

          {/* Locked Room Info */}
          {room && (
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 text-xs space-y-2.5 transition-colors">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] block">
                Thông tin phòng thuê (Khóa sửa):
              </span>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Phòng:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{room.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Tòa nhà:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{room.property?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Giá thuê:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(room.rentPrice)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Edit Profile & Change Password */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit personal info */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Thông tin cá nhân</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">
              Bạn có thể cập nhật họ tên và số điện thoại liên lạc khi cần.
            </p>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Số điện thoại liên lạc
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>

          {/* Change password */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Đổi mật khẩu tài khoản
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">
              Định kỳ thay đổi mật khẩu để tăng cường an toàn thông tin.
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
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nhập lại mật khẩu mới *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Khớp với mật khẩu mới"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {changingPass ? "Đang xử lý..." : "Cập nhật mật khẩu mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
