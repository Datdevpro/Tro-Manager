"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Lock, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import dynamic from "next/dynamic";

const CloudsBackground = dynamic(
  () => import("@/components/ui/CloudsBackground"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4" />
    ),
  }
);

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Đăng nhập thất bại");
        return;
      }

      toast.success("Đăng nhập thành công!");
      const destination = callbackUrl || data.data.redirectUrl;
      router.push(destination);
      router.refresh();
    } catch (err: any) {
      toast.error("Lỗi kết nối máy chủ, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CloudsBackground
      /* ========================================================
       * TÙY CHỈNH MÀU SẮC VANTA CLOUDS (Dùng mã số Hex 0x...):
       * - backgroundColor:  Màu nền cơ sở (ví dụ: 0x0 hoặc 0xffffff)
       * - skyColor:         Màu bầu trời (ví dụ: 0x5ca6ca hoặc 0x68b8d7)
       * - cloudColor:       Màu mây (ví dụ: 0x334d80 hoặc 0xadc1de)
       * - cloudShadowColor: Màu vùng tối của mây (ví dụ: 0x183550)
       * - sunColor:         Màu mặt trời (ví dụ: 0xff9919)
       * - sunlightColor:    Màu ánh nắng mặt trời (ví dụ: 0xff9933)
       * - speed:            Tốc độ trôi của mây (ví dụ: 1.0)
       * ======================================================== */
      backgroundColor={0x2b1055}
      skyColor={0xf77f00}
      cloudColor={0x7b2cbf}
      cloudShadowColor={0x3c096c}
      sunColor={0xffd166}
      sunlightColor={0x3b0a79}
      speed={1.0}
      className="p-4"
    >
      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/40 text-white mb-4 ring-4 ring-white/30 backdrop-blur-sm">
            <Building2 className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
            TroManage
          </h1>
          <p className="text-white/95 font-medium text-sm mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
            Hệ thống Quản lý Nhà trọ & Căn hộ Dịch vụ Toàn diện
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl p-7 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Đăng nhập tài khoản</h2>
          <p className="text-xs text-slate-600 mb-6">
            Nhập email và mật khẩu của bạn. Hệ thống sẽ tự động nhận diện tài khoản Quản trị viên hay Cư dân.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email đăng nhập
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhap-email@domain.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-white/95 font-medium mt-6 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
          TroManage SaaS Engine &copy; 2026. Production-Ready Rental Management.
        </p>
      </div>
    </CloudsBackground>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
