"use client";

import React, { useState, useEffect } from "react";
import { FormModal } from "@/components/ui/FormModal";
import { formatCurrency, formatMonthYear } from "@/lib/utils";
import {
  QrCode,
  Banknote,
  Copy,
  Check,
  Building,
  Phone,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onPaymentSuccess?: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [method, setMethod] = useState<"BANK_TRANSFER" | "CASH">("BANK_TRANSFER");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Cấu hình tài khoản ngân hàng của Ban Quản Lý (Mặc định)
  const bankConfig = {
    bankId: "VCB", // Vietcombank
    bankName: "Ngân hàng Ngoại Thương (Vietcombank)",
    accountNo: "9988776655",
    accountName: "BAN QUAN LY NHA TRO",
  };

  useEffect(() => {
    if (invoice) {
      const remaining =
        typeof invoice.remainingAmount === "number"
          ? invoice.remainingAmount
          : invoice.total - (invoice.paidAmount || 0);
      setPayAmount(Math.max(0, remaining));
      setNote("");
    }
  }, [invoice]);

  if (!invoice) return null;

  const roomNumber = invoice.room?.roomNumber || "P";
  const monthStr = invoice.month ? invoice.month.replace("-", "") : "";
  const invoiceShortId = invoice.id ? invoice.id.slice(-5).toUpperCase() : "";
  const transferContent = `TT PHONG ${roomNumber} T${monthStr} ${invoiceShortId}`;

  // Link sinh mã QR VietQR chuẩn ngân hàng
  const vietQrUrl = `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact2.png?amount=${payAmount}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(bankConfig.accountName)}`;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}`);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      toast.error("Vui lòng nhập số tiền thanh toán hợp lệ");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/tenant/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: payAmount,
          paymentMethod: method,
          note: note.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          method === "BANK_TRANSFER"
            ? "Đã ghi nhận thanh toán chuyển khoản thành công!"
            : "Đã gửi yêu cầu thanh toán tiền mặt thành công!"
        );
        onPaymentSuccess?.();
        onClose();
      } else {
        toast.error(json.message || "Lỗi khi xử lý thanh toán");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cổng Thanh Toán Hóa Đơn"
      description={`Kỳ ${formatMonthYear(invoice.month)} • Phòng ${roomNumber}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Tóm tắt số tiền */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <div>
            <span className="text-slate-600 dark:text-slate-400 block">Tổng hóa đơn:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(invoice.total)}
            </span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400 block">Đã thanh toán:</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(invoice.paidAmount || 0)}
            </span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400 block">Số tiền còn nợ:</span>
            <span className="text-sm font-extrabold text-rose-700 dark:text-rose-400">
              {formatCurrency(
                typeof invoice.remainingAmount === "number"
                  ? invoice.remainingAmount
                  : invoice.total - (invoice.paidAmount || 0)
              )}
            </span>
          </div>
        </div>

        {/* Tab lựa chọn phương thức thanh toán */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Chọn phương thức thanh toán:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod("BANK_TRANSFER")}
              className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border text-xs font-bold transition-all ${
                method === "BANK_TRANSFER"
                  ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs ring-2 ring-emerald-500/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Chuyển khoản VietQR</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod("CASH")}
              className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border text-xs font-bold transition-all ${
                method === "CASH"
                  ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs ring-2 ring-emerald-500/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Tiền mặt trực tiếp</span>
            </button>
          </div>
        </div>

        {/* Nội dung chi tiết từng phương thức */}
        {method === "BANK_TRANSFER" ? (
          <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Mã VietQR */}
              <div className="flex flex-col items-center shrink-0">
                <div className="bg-white p-2.5 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vietQrUrl}
                    alt="VietQR Chuyển Khoản"
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                  />
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  Quét bằng ứng dụng Ngân hàng
                </span>
              </div>

              {/* Thông tin chuyển khoản chi tiết */}
              <div className="flex-1 w-full space-y-2.5 text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 text-[10px] block uppercase font-bold">
                      Ngân hàng thụ hưởng
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {bankConfig.bankName}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 text-[10px] block uppercase font-bold">
                      Số tài khoản
                    </span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm tracking-wider">
                      {bankConfig.accountNo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankConfig.accountNo, "Số tài khoản")}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                    title="Sao chép số tài khoản"
                  >
                    {copiedField === "Số tài khoản" ? (
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 text-[10px] block uppercase font-bold">
                      Tên chủ tài khoản
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {bankConfig.accountName}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 text-[10px] block uppercase font-bold">
                      Số tiền thanh toán
                    </span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                      {formatCurrency(payAmount)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(payAmount.toString(), "Số tiền")}
                    className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition"
                    title="Sao chép số tiền"
                  >
                    {copiedField === "Số tiền" ? (
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="overflow-hidden mr-2">
                    <span className="text-slate-600 dark:text-slate-400 text-[10px] block uppercase font-bold">
                      Nội dung chuyển khoản (bắt buộc)
                    </span>
                    <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-xs block truncate">
                      {transferContent}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(transferContent, "Nội dung chuyển khoản")}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition shrink-0"
                    title="Sao chép nội dung"
                  >
                    {copiedField === "Nội dung chuyển khoản" ? (
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
              <p>
                Sau khi chuyển khoản thành công trên app ngân hàng, bạn vui lòng nhấn nút{" "}
                <strong>&quot;Tôi đã chuyển khoản xong&quot;</strong> bên dưới để hệ thống cập nhật hóa đơn.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold block">
                    Địa điểm nộp tiền
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Văn phòng Quản lý Tòa nhà
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    {invoice.room?.property?.address || "Tầng 1 khu trọ"}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold block">
                    Hotline Ban Quản Lý
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    0912.345.678 (Chị Lan QL)
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">Hỗ trợ Zalo / Gọi trực tiếp</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 text-xs">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold block">
                  Thời gian tiếp nhận tiền mặt
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  08:00 - 21:00 các ngày trong tuần (Kể cả Thứ 7, Chủ Nhật)
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Ghi chú thêm khi nộp tiền mặt (không bắt buộc):
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Đã hẹn gửi tiền mặt lúc 19h tối nay tại phòng bảo vệ..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>
        )}

        {/* Số tiền muốn thanh toán */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Số tiền muốn thanh toán kỳ này:
            </label>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Đơn vị: VNĐ</span>
          </div>
          <input
            type="number"
            min={1000}
            step={1000}
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
          />
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition disabled:opacity-50"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || payAmount <= 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : method === "BANK_TRANSFER" ? (
              <>
                <Check className="w-4 h-4" />
                Tôi đã chuyển khoản xong
              </>
            ) : (
              <>
                <Banknote className="w-4 h-4" />
                Gửi yêu cầu đóng tiền mặt
              </>
            )}
          </button>
        </div>
      </div>
    </FormModal>
  );
}
