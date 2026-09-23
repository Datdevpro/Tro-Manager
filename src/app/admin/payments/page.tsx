"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Receipt,
  User,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { FormModal } from "@/components/ui/FormModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal Record Payment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentDate, setPaymentDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "10");
      if (search) params.set("search", search);
      if (methodFilter) params.set("paymentMethod", methodFilter);

      const res = await fetch(`/api/payments?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setPayments(json.data.items);
        setTotalPages(json.data.totalPages);
        setTotalItems(json.data.total);
      }
    } catch {
      toast.error("Lỗi khi tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  }, [page, search, methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Load unpaid invoices for payment modal
  const loadUnpaidInvoices = async () => {
    try {
      const res = await fetch("/api/invoices?pageSize=100");
      const json = await res.json();
      if (json.success) {
        const unpaids = json.data.items.filter(
          (inv: any) => inv.status === "UNPAID" || inv.status === "OVERDUE"
        );
        setUnpaidInvoices(unpaids);
        if (unpaids.length > 0 && !selectedInvoiceId) {
          setSelectedInvoiceId(unpaids[0].id);
          setAmount(unpaids[0].remainingAmount || unpaids[0].total);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openRecordModal = () => {
    loadUnpaidInvoices();
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setNote("Thanh toán tiền phòng");
    setIsModalOpen(true);
  };

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = unpaidInvoices.find((i) => i.id === invId);
    if (inv) {
      setAmount(inv.remainingAmount || inv.total);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || amount <= 0) {
      toast.error("Vui lòng chọn hóa đơn và số tiền hợp lệ");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          amount,
          paymentMethod,
          paymentDate,
          note,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setIsModalOpen(false);
        fetchPayments();
      } else {
        toast.error(json.message || "Lỗi ghi nhận thanh toán");
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
        title="Lịch sử Thu tiền & Thanh toán"
        description="Ghi nhận dòng tiền thực thu từ cư dân qua các hình thức Tiền mặt, Chuyển khoản ngân hàng."
        icon={CreditCard}
        actions={
          <button
            onClick={openRecordModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Thu tiền hóa đơn
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Tìm theo phòng, tên khách hoặc ghi chú..."
          className="w-full md:w-80"
        />

        <div className="flex items-center gap-3">
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Tất cả hình thức</option>
            <option value="BANK_TRANSFER">Chuyển khoản</option>
            <option value="CASH">Tiền mặt</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Ngày thu</th>
                <th className="px-5 py-3.5">Phòng / Khu trọ</th>
                <th className="px-5 py-3.5">Khách nộp</th>
                <th className="px-5 py-3.5">Phương thức</th>
                <th className="px-5 py-3.5">Số tiền</th>
                <th className="px-5 py-3.5">Nội dung / Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    <LoadingSkeleton className="h-8 w-full mb-2" count={5} />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <EmptyState
                      title="Chưa có giao dịch thanh toán nào"
                      description="Ghi nhận thanh toán đầu tiên từ khách thuê."
                      icon={CreditCard}
                    />
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      {formatDate(p.paymentDate)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 block text-sm">
                        {p.invoice?.room?.roomNumber || "Hóa đơn"}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {p.invoice?.room?.property?.name}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {p.invoice?.tenant?.user?.fullName}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {p.invoice?.tenant?.user?.phone}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {p.paymentMethod === "BANK_TRANSFER"
                          ? "Chuyển khoản"
                          : p.paymentMethod === "CASH"
                          ? "Tiền mặt"
                          : "Khác"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                        +{formatCurrency(p.amount)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {p.note || <span className="text-slate-500 dark:text-slate-400 italic">Không có ghi chú</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            pageSize={10}
          />
        </div>
      </div>

      {/* Modal Record Payment */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ghi Nhận Thu Tiền Hóa Đơn"
        description="Chọn hóa đơn đang nợ và nhập số tiền thực thu"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Chọn hóa đơn cần thanh toán *
            </label>
            {unpaidInvoices.length === 0 ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-xl">
                Tuyệt vời! Hiện tại không có hóa đơn nào chưa thanh toán.
              </p>
            ) : (
              <select
                required
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
              >
                {unpaidInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.room?.roomNumber} - {inv.tenant?.user?.fullName} (Kỳ {inv.month}) - Còn nợ: {formatCurrency(inv.remainingAmount)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Số tiền thu (VNĐ) *
            </label>
            <input
              type="number"
              min={1000}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Phương thức *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="BANK_TRANSFER">Chuyển khoản</option>
                <option value="CASH">Tiền mặt</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Ngày thanh toán *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Ghi chú giao dịch
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Cư dân nộp tiền mặt tại văn phòng BQL"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || unpaidInvoices.length === 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {submitting ? "Đang lưu..." : "Xác nhận thu tiền"}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
