"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Receipt,
  Plus,
  Zap,
  Printer,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Trash2,
  Edit,
  ArrowRight,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate, formatCurrency, formatMonthYear } from "@/lib/utils";
import { toast } from "sonner";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Bulk Generate Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMonth, setBulkMonth] = useState(currentMonth);
  const [bulkDueDate, setBulkDueDate] = useState("");
  const [generatingBulk, setGeneratingBulk] = useState(false);

  // Create/Edit single invoice modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [roomId, setRoomId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [roomFee, setRoomFee] = useState(0);
  const [electricFee, setElectricFee] = useState(0);
  const [waterFee, setWaterFee] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [otherFee, setOtherFee] = useState(0);
  const [previousDebt, setPreviousDebt] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Detail & Print Modal
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);

  // Record Payment Modal
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payNote, setPayNote] = useState("");
  const [submittingPay, setSubmittingPay] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "10");
      if (search) params.set("search", search);
      if (monthFilter) params.set("month", monthFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setInvoices(json.data.items);
        setTotalPages(json.data.totalPages);
        setTotalItems(json.data.total);
      }
    } catch {
      toast.error("Lỗi khi tải danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  }, [page, search, monthFilter, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Load rooms and tenants
  useEffect(() => {
    async function loadMeta() {
      const [rRes, tRes] = await Promise.all([
        fetch("/api/rooms?pageSize=100"),
        fetch("/api/tenants?pageSize=100"),
      ]);
      const [rJson, tJson] = await Promise.all([rRes.json(), tRes.json()]);
      if (rJson.success) setRooms(rJson.data.items);
      if (tJson.success) setTenants(tJson.data.items);
    }
    loadMeta();
  }, []);

  const openBulkModal = () => {
    setBulkMonth(currentMonth);
    const d = new Date();
    d.setDate(25);
    setBulkDueDate(d.toISOString().split("T")[0]);
    setIsBulkModalOpen(true);
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGeneratingBulk(true);
      const res = await fetch("/api/invoices/generate-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: bulkMonth,
          dueDate: bulkDueDate,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setIsBulkModalOpen(false);
        fetchInvoices();
      } else {
        toast.error(json.message || "Lỗi phát hành hóa đơn hàng loạt");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setGeneratingBulk(false);
    }
  };

  const openCreateModal = () => {
    setEditingInvoice(null);
    if (rooms.length > 0) {
      const r = rooms[0];
      setRoomId(r.id);
      setRoomFee(r.rentPrice);
      if (r.tenants && r.tenants[0]) {
        setTenantId(r.tenants[0].id);
      } else if (tenants.length > 0) {
        setTenantId(tenants[0].id);
      }
    }
    setMonth(currentMonth);
    setElectricFee(0);
    setWaterFee(0);
    setServiceFee(0);
    setOtherFee(0);
    setPreviousDebt(0);
    setDiscount(0);
    const d = new Date();
    d.setDate(20);
    setDueDate(d.toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const openPaymentModal = (inv: any) => {
    setPaymentInvoice(inv);
    setPayAmount(inv.remainingAmount || inv.total);
    setPayMethod("BANK_TRANSFER");
    setPayNote("Thanh toán tiền phòng");
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice || payAmount <= 0) {
      toast.error("Vui lòng nhập số tiền thanh toán hợp lệ");
      return;
    }

    try {
      setSubmittingPay(true);
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: paymentInvoice.id,
          amount: payAmount,
          paymentMethod: payMethod,
          note: payNote,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Ghi nhận thanh toán thành công!");
        setPaymentInvoice(null);
        fetchInvoices();
      } else {
        toast.error(json.message || "Lỗi ghi nhận thanh toán");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/invoices/${deleteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setDeleteId(null);
        fetchInvoices();
      } else {
        toast.error(json.message || "Không thể xóa hóa đơn");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Hóa đơn & Thu phí"
        description="Tính toán tổng hợp tiền phòng, điện, nước, dịch vụ và theo dõi thanh toán cư dân."
        icon={Receipt}
        actions={
          <>
            <button
              onClick={openBulkModal}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              Tự động tính hóa đơn hàng loạt
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Tạo hóa đơn lẻ
            </button>
          </>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Tìm theo số phòng hoặc tên khách..."
          className="w-full md:w-80"
        />

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="UNPAID">Chưa thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="OVERDUE">Quá hạn</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Kỳ / Hóa đơn</th>
                <th className="px-5 py-3.5">Phòng / Khách thuê</th>
                <th className="px-5 py-3.5">Chi tiết chi phí</th>
                <th className="px-5 py-3.5">Tổng tiền</th>
                <th className="px-5 py-3.5">Đã đóng / Còn lại</th>
                <th className="px-5 py-3.5">Hạn đóng</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    <LoadingSkeleton className="h-8 w-full mb-2" count={5} />
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <EmptyState
                      title="Không có hóa đơn nào"
                      description="Hãy bấm 'Tự động tính hóa đơn hàng loạt' để phát hành phiếu thu cho các phòng đang thuê."
                      icon={Receipt}
                    />
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 block text-sm">
                        {formatMonthYear(inv.month)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        #{inv.id.slice(-6).toUpperCase()}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-indigo-600 block text-sm">
                        {inv.room?.roomNumber}
                      </span>
                      <span className="text-[11px] text-slate-700 font-medium">
                        {inv.tenant?.user?.fullName}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600 text-[11px] space-y-0.5">
                      <div>Phòng: {formatCurrency(inv.roomFee)}</div>
                      <div>Điện + Nước: {formatCurrency(inv.electricFee + inv.waterFee)}</div>
                      <div>Dịch vụ: {formatCurrency(inv.serviceFee)}</div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {formatCurrency(inv.total)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-emerald-600 block">
                        +{formatCurrency(inv.paidAmount)}
                      </span>
                      <span className="text-[11px] font-semibold text-rose-600">
                        Còn: {formatCurrency(inv.remainingAmount)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600 font-medium">
                      {formatDate(inv.dueDate)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={inv.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                          title="Xem chi tiết & In phiếu"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.status !== "PAID" && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition font-semibold flex items-center gap-1"
                            title="Ghi nhận đóng tiền"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa hóa đơn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            pageSize={10}
          />
        </div>
      </div>

      {/* Modal Bulk Generate Invoices */}
      <FormModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Tự Động Tính & Phát Hành Hóa Đơn Hàng Loạt"
        description="Hệ thống sẽ tự động quét tất cả phòng đang thuê, cộng tiền phòng, tiền điện nước đã ghi và dịch vụ để tạo hóa đơn."
        maxWidth="md"
      >
        <form onSubmit={handleBulkGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Chọn kỳ tháng phát hành *
            </label>
            <input
              type="month"
              required
              value={bulkMonth}
              onChange={(e) => setBulkMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Hạn chót thanh toán (Due Date) *
            </label>
            <input
              type="date"
              required
              value={bulkDueDate}
              onChange={(e) => setBulkDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
            Hệ thống sẽ tự động bỏ qua những phòng đã có hóa đơn trong tháng này để tránh phát hành trùng lặp.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={generatingBulk}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {generatingBulk ? "Đang tính toán..." : "Tiến hành phát hành"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Modal Record Payment */}
      <FormModal
        isOpen={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        title="Ghi Nhận Thanh Toán Hóa Đơn"
        description={`Hóa đơn phòng ${paymentInvoice?.room?.roomNumber} - ${paymentInvoice ? formatMonthYear(paymentInvoice.month) : ""}`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500">Số tiền còn thiếu:</span>
            <span className="text-base font-extrabold text-rose-600">
              {paymentInvoice ? formatCurrency(paymentInvoice.remainingAmount) : "0 ₫"}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Số tiền thu đợt này (VNĐ) *
            </label>
            <input
              type="number"
              min={1000}
              required
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Phương thức thanh toán *
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="BANK_TRANSFER">Chuyển khoản Ngân Hàng (BANK_TRANSFER)</option>
              <option value="CASH">Tiền mặt trực tiếp (CASH)</option>
              <option value="OTHER">Khác (Ví điện tử / Quẹt thẻ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Ghi chú giao dịch
            </label>
            <input
              type="text"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              placeholder="VD: Chuyển khoản qua Vietcombank ngày..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPaymentInvoice(null)}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submittingPay}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {submittingPay ? "Đang ghi nhận..." : "Xác nhận đã thu tiền"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Detailed Invoice & Print View Modal */}
      <FormModal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        title="Phiếu Hóa Đơn Thu Tiền Nhà"
        description="Bản kê chi tiết từng khoản mục và mã giao dịch"
        maxWidth="lg"
      >
        {viewingInvoice && (
          <div className="space-y-4 text-xs print:p-0">
            {/* Header info */}
            <div className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Hóa đơn số</span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  #{viewingInvoice.id.slice(-8).toUpperCase()}
                </h3>
                <p className="text-indigo-600 font-bold mt-0.5">
                  Kỳ {formatMonthYear(viewingInvoice.month)}
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={viewingInvoice.status} />
                <p className="text-slate-500 text-[11px] mt-1.5">
                  Hạn đóng: {formatDate(viewingInvoice.dueDate)}
                </p>
              </div>
            </div>

            {/* Tenant & Room details */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-white border border-slate-200 rounded-xl">
              <div>
                <span className="text-slate-400 block mb-0.5">Phòng:</span>
                <span className="text-sm font-bold text-slate-900">
                  {viewingInvoice.room?.roomNumber} ({viewingInvoice.room?.property?.name})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Người thuê:</span>
                <span className="text-sm font-bold text-slate-900">
                  {viewingInvoice.tenant?.user?.fullName}
                </span>
                <span className="text-slate-500 block text-[11px]">
                  SĐT: {viewingInvoice.tenant?.user?.phone || "--"}
                </span>
              </div>
            </div>

            {/* Itemized breakdown table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Khoản mục</th>
                    <th className="p-3 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-medium text-slate-800">1. Tiền thuê phòng</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatCurrency(viewingInvoice.roomFee)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">2. Tiền điện tiêu thụ</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatCurrency(viewingInvoice.electricFee)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">3. Tiền nước sinh hoạt</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatCurrency(viewingInvoice.waterFee)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">4. Phí dịch vụ (Wifi, Rác, Xe, Thang máy...)</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatCurrency(viewingInvoice.serviceFee)}
                    </td>
                  </tr>
                  {viewingInvoice.otherFee > 0 && (
                    <tr>
                      <td className="p-3 font-medium text-slate-800">
                        <div className="font-semibold text-slate-900">5. Phí khác phát sinh</div>
                        {viewingInvoice.additionalFees && viewingInvoice.additionalFees.length > 0 && (
                          <div className="mt-1.5 space-y-1 bg-amber-50/70 p-2 rounded-lg border border-amber-100 text-[11px] text-amber-900 font-normal">
                            <span className="font-semibold text-[10px] text-amber-700 uppercase tracking-wider block">Các khoản phát sinh:</span>
                            {viewingInvoice.additionalFees.map((af: any) => (
                              <div key={af.id} className="flex justify-between items-center text-slate-700">
                                <span>• {af.title}{af.description ? ` (${af.description})` : ""}</span>
                                <span className="font-semibold text-slate-900">{formatCurrency(af.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 align-top">
                        {formatCurrency(viewingInvoice.otherFee)}
                      </td>
                    </tr>
                  )}
                  {viewingInvoice.previousDebt > 0 && (
                    <tr>
                      <td className="p-3 font-medium text-rose-600">6. Nợ kỳ trước chuyển sang</td>
                      <td className="p-3 text-right font-bold text-rose-600">
                        +{formatCurrency(viewingInvoice.previousDebt)}
                      </td>
                    </tr>
                  )}
                  {viewingInvoice.discount > 0 && (
                    <tr>
                      <td className="p-3 font-medium text-emerald-600">7. Giảm giá / Khuyến mãi</td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        -{formatCurrency(viewingInvoice.discount)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-indigo-50/50 border-t-2 border-indigo-100 font-bold">
                  <tr>
                    <td className="p-3.5 text-sm text-slate-900 uppercase">Tổng cộng thanh toán:</td>
                    <td className="p-3.5 text-right text-base text-indigo-700">
                      {formatCurrency(viewingInvoice.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment history on this invoice */}
            {viewingInvoice.payments && viewingInvoice.payments.length > 0 && (
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
                <span className="font-bold text-emerald-900 block text-xs uppercase">
                  Lịch sử thanh toán đã ghi nhận:
                </span>
                {viewingInvoice.payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between text-[11px] text-emerald-800">
                    <span>
                      {formatDate(p.paymentDate)} ({p.paymentMethod}): {p.note || "Đã thu"}
                    </span>
                    <span className="font-bold">+{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                In phiếu hóa đơn
              </button>
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </FormModal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa hóa đơn"
        message="Bạn có chắc chắn muốn xóa hóa đơn này không?"
        isDestructive
        isLoading={deleting}
      />
    </div>
  );
}
