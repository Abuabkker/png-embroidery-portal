"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Package, Clock, Truck, CreditCard, User, MapPin,
  Edit3, Save, Trash2, Loader2, Check, AlertTriangle, FileText,
  ChevronRight, Download, BadgeDollarSign,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";

// ── Workflow definition ───────────────────────────────────────────────────────
const WORKFLOW: { value: string; label: string }[] = [
  { value: "PENDING_CONFIRMATION", label: "Pending Confirmation" },
  { value: "CONFIRMED",            label: "Confirmed" },
  { value: "ORDER_RECEIVED",       label: "Order Received" },
  { value: "IN_REVIEW",            label: "In Review" },
  { value: "PROOF_SENT",           label: "Proof Sent" },
  { value: "IN_PRODUCTION",        label: "In Production" },
  { value: "QUALITY_CHECK",        label: "Quality Check" },
  { value: "SHIPPED",              label: "Shipped" },
  { value: "DELIVERED",            label: "Delivered" },
];

function CustomizationBadges({ c }: { c: any }) {
  if (!c) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {c.size  && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Size: {c.size}</span>}
      {c.color && <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Color: {c.color}</span>}
      {c.embroideryNames?.filter(Boolean).length > 0 && (
        <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
          Embroidery: {c.embroideryNames.filter(Boolean).join(", ")}
        </span>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0 w-32">{label}</span>
      <span className="text-xs font-semibold text-gray-800 text-right">{value || "—"}</span>
    </div>
  );
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder]             = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Editable fields
  const [newStatus, setNewStatus]           = useState("");
  const [statusNote, setStatusNote]         = useState("");
  const [adminNotes, setAdminNotes]         = useState("");
  const [trackingNumber, setTracking]       = useState("");
  const [estimatedDelivery, setEstDelivery] = useState("");

  // Payment fields
  const [paymentStatus, setPaymentStatus]       = useState("");
  const [paymentMethod, setPaymentMethod]       = useState("");
  const [paymentReceivedDate, setPayRecDate]    = useState("");
  const [bankDepositRef, setBankRef]            = useState("");
  const [amountReceived, setAmountReceived]     = useState("");
  const [paymentNotes, setPaymentNotes]         = useState("");
  const [savingPayment, setSavingPayment]       = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then(r => r.json())
      .then(d => {
        const o = d.data;
        setOrder(o);
        setAdminNotes(o?.adminNotes || "");
        setTracking(o?.trackingNumber || "");
        setEstDelivery(o?.estimatedDelivery ? new Date(o.estimatedDelivery).toISOString().split("T")[0] : "");
        setNewStatus(o?.status || "");
        setPaymentStatus(o?.paymentStatus || "PENDING");
        setPaymentMethod(o?.paymentMethod || "bank_transfer");
        setPayRecDate(o?.paymentReceivedDate ? new Date(o.paymentReceivedDate).toISOString().split("T")[0] : "");
        setBankRef(o?.bankDepositRef || "");
        setAmountReceived(o?.amountReceived ? String(o.amountReceived) : "");
        setPaymentNotes(o?.paymentNotes || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleStatusUpdate() {
    if (!newStatus) return;
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        adminNotes: statusNote || adminNotes || undefined,
        trackingNumber: trackingNumber || undefined,
        estimatedDelivery: estimatedDelivery || undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setOrder((prev: any) => ({
        ...prev,
        status: newStatus,
        adminNotes: statusNote || adminNotes,
        trackingNumber,
        estimatedDelivery,
        statusHistory: [
          { id: Date.now().toString(), status: newStatus, note: statusNote, createdAt: new Date().toISOString() },
          ...(prev.statusHistory || []),
        ],
      }));
      setStatusNote("");
    }
    setSaving(false);
  }

  async function handleSaveDetails() {
    setSaving(true);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNotes, trackingNumber, estimatedDelivery: estimatedDelivery || undefined }),
    });
    setSaving(false);
  }

  async function handleSavePayment() {
    setSavingPayment(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentStatus,
        paymentMethod,
        paymentReceivedDate: paymentReceivedDate || undefined,
        bankDepositRef:      bankDepositRef || undefined,
        amountReceived:      amountReceived || undefined,
        paymentNotes:        paymentNotes || undefined,
      }),
    });
    if (res.ok) {
      setOrder((prev: any) => ({ ...prev, paymentStatus, paymentMethod, bankDepositRef, amountReceived, paymentNotes }));
    }
    setSavingPayment(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/orders");
    else setDeleting(false);
  }

  if (loading) return (
    <div className="animate-pulse space-y-4 max-w-6xl">
      <div className="h-6 bg-gray-100 rounded w-48" />
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="h-64 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <div className="h-64 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );

  if (!order) return (
    <div className="text-center py-20">
      <p className="font-bold text-gray-700 mb-3">Order not found</p>
      <Link href="/admin/orders" className="text-navy text-sm font-semibold hover:underline">← Back to Orders</Link>
    </div>
  );

  const currentIdx = WORKFLOW.findIndex(w => w.value === order.status);

  return (
    <div className="max-w-6xl">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 mb-5">
        <Link href="/admin/orders" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ChevronLeft size={14} /> Orders
        </Link>
        <ChevronRight size={12} className="text-gray-300" />
        <span className="text-sm font-bold text-gray-900">#{order.orderNumber}</span>
      </div>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            <span className="mx-1.5 text-gray-300">·</span>
            <span className="font-semibold text-gray-700">{order.user?.name}</span>
            {order.user?.role === "SUPERIOR_CUSTOMER" && (
              <span className="ml-1.5 text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase">Superior</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          {confirmDelete ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <span className="text-xs font-semibold text-red-700">Delete order?</span>
              <button onClick={handleDelete} disabled={deleting}
                className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg disabled:opacity-60">
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-gray-800">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors">
              <Trash2 size={13} /> Delete Order
            </button>
          )}
        </div>
      </div>

      {/* ── Progress stepper ── */}
      {order.status !== "CANCELLED" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max">
            {WORKFLOW.map((step, i) => {
              const done    = i < currentIdx;
              const current = i === currentIdx;
              return (
                <div key={step.value} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                      ${current ? "bg-navy text-white" : done ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                      {done ? <Check size={10} strokeWidth={3} /> : i + 1}
                    </div>
                    <span className={`text-[9px] font-semibold text-center w-16 leading-tight
                      ${current ? "text-navy" : done ? "text-green-600" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < WORKFLOW.length - 1 && (
                    <div className={`h-0.5 w-6 mb-4 ${done ? "bg-green-400" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left col (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <p className="font-extrabold text-gray-900 flex items-center gap-2"><Package size={15} /> Order Items</p>
              <span className="text-xs text-gray-400">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 p-4">
                  <div className="w-14 h-14 shrink-0 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex items-center justify-center">
                    {item.productImage
                      ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain p-1" />
                      : <Package size={16} className="text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900">{item.productName}</p>
                    <CustomizationBadges c={item.customization} />
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">Qty: <span className="font-bold text-gray-700">{item.quantity}</span></span>
                      <span className="text-xs text-gray-400">Unit: <span className="font-bold text-gray-700">{formatCurrency(Number(item.unitPrice))}</span></span>
                      {Number(item.customSurcharge) > 0 && (
                        <span className="text-xs text-blue-500">+{formatCurrency(Number(item.customSurcharge))} embroidery</span>
                      )}
                    </div>
                  </div>
                  <p className="font-bold text-sm text-gray-900 shrink-0">{formatCurrency(Number(item.lineTotal))}</p>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="font-semibold text-gray-800">{formatCurrency(Number(order.subtotal))}</span></div>
              {Number(order.customTotal) > 0 && <div className="flex justify-between text-gray-500"><span>Embroidery</span><span className="font-semibold text-gray-800">{formatCurrency(Number(order.customTotal))}</span></div>}
              <div className="flex justify-between text-gray-500"><span>Delivery</span><span className="font-semibold text-green-600">FREE</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-semibold">-{formatCurrency(Number(order.discount))}</span></div>}
              <div className="flex justify-between font-extrabold text-gray-900 text-base pt-1 border-t border-gray-200"><span>Total</span><span>{formatCurrency(Number(order.total))}</span></div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-extrabold text-sm text-gray-900 mb-4 flex items-center gap-2"><Clock size={15} /> Order Timeline</p>
            {order.statusHistory?.length > 0 ? (
              <div className="space-y-0">
                {[...order.statusHistory].reverse().map((h: any, i: number, arr: any[]) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 border-2 ${i === 0 ? "bg-navy border-navy" : "bg-white border-gray-300"}`} />
                      {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-gray-800">{h.status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                        {i === 0 && <span className="text-[9px] bg-navy text-white px-1.5 py-0.5 rounded font-bold">CURRENT</span>}
                      </div>
                      {h.note && <p className="text-xs text-gray-400 mt-0.5">{h.note}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(h.createdAt).toLocaleString()}
                        {h.changedByUser?.name && (
                          <span className="ml-1.5 text-gray-400">· by {h.changedByUser.name}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No history yet.</p>
            )}
          </div>

          {/* Customization review / proofs */}
          {order.customizationReview && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-extrabold text-sm text-gray-900 mb-4 flex items-center gap-2"><FileText size={15} /> Customization Review</p>
              <InfoRow label="Review Status" value={order.customizationReview.status.replace(/_/g, " ")} />
              {order.customizationReview.instructions && <InfoRow label="Instructions" value={order.customizationReview.instructions} />}
              {order.customizationReview.adminComment && <InfoRow label="Admin Comment" value={order.customizationReview.adminComment} />}
              {(order.customizationReview.uploadedFiles as string[])?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">Uploaded Files</p>
                  <div className="flex flex-wrap gap-2">
                    {(order.customizationReview.uploadedFiles as string[]).map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-navy font-semibold border border-navy/20 rounded-lg px-2 py-1 hover:bg-navy/5">
                        <Download size={11} /> File {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right col (1/3) ── */}
        <div className="space-y-5">

          {/* Update status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-extrabold text-sm text-gray-900 mb-3">Update Status</p>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 mb-2 outline-none focus:border-navy">
              {WORKFLOW.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              <option value="CANCELLED">Cancelled</option>
            </select>
            <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)}
              placeholder="Add a note (optional)…"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 mb-3 outline-none focus:border-navy resize-none" />
            <button onClick={handleStatusUpdate} disabled={saving || newStatus === order.status}
              className="w-full flex items-center justify-center gap-2 bg-navy text-white text-sm font-bold py-2.5 rounded-xl hover:bg-navy-dark disabled:opacity-50 transition-colors">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Apply Status</>}
            </button>
            {newStatus === "CANCELLED" && newStatus !== order.status && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-2">
                <AlertTriangle size={11} /> Customer & superior will be notified of cancellation.
              </p>
            )}
          </div>

          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-extrabold text-sm text-gray-900 mb-3 flex items-center gap-2"><User size={14} /> Customer</p>
            <InfoRow label="Name"  value={order.user?.name} />
            <InfoRow label="Email" value={order.user?.email} />
            <InfoRow label="Phone" value={order.user?.phone} />
            <InfoRow label="Role"  value={order.user?.role?.replace(/_/g, " ")} />
            {order.address && <>
              <p className="text-xs font-bold text-gray-500 mt-3 mb-2 flex items-center gap-1"><MapPin size={11} /> Delivery Address</p>
              <InfoRow label="Name"     value={order.address.fullName} />
              <InfoRow label="Street"   value={order.address.street} />
              <InfoRow label="City"     value={order.address.city} />
              <InfoRow label="Province" value={order.address.province} />
              <InfoRow label="Country"  value={order.address.country} />
            </>}
          </div>

          {/* Payment & shipping */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-extrabold text-sm text-gray-900 mb-3 flex items-center gap-2"><CreditCard size={14} /> Payment & Delivery</p>
            <InfoRow label="Payment"       value={(order.paymentMethod ?? "bank_transfer").replace(/_/g, " ")} />
            <InfoRow label="Payment Status" value={order.paymentStatus} />
            <InfoRow label="Delivery"      value="Free" />
            {order.discountCode && <InfoRow label="Discount Code" value={order.discountCode} />}
          </div>

          {/* Tracking & delivery */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-extrabold text-sm text-gray-900 mb-3 flex items-center gap-2"><Truck size={14} /> Tracking & Delivery</p>
            <label className="block text-xs text-gray-500 mb-1">Tracking Number</label>
            <input value={trackingNumber} onChange={e => setTracking(e.target.value)}
              placeholder="e.g. PNG-TRK-00123"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 mb-3 outline-none focus:border-navy" />
            <label className="block text-xs text-gray-500 mb-1">Estimated Delivery</label>
            <input type="date" value={estimatedDelivery} onChange={e => setEstDelivery(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 mb-3 outline-none focus:border-navy" />
            {order.deliveredAt && <InfoRow label="Delivered At" value={new Date(order.deliveredAt).toLocaleDateString()} />}
          </div>

          {/* Payment management */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <BadgeDollarSign size={15} /> Payment
              </p>
              {/* Current payment status badge */}
              {(() => {
                const ps = order.paymentStatus;
                const cfg =
                  ps === "PAID"          ? "bg-green-100 text-green-700" :
                  ps === "PARTIALLY_PAID"? "bg-blue-100 text-blue-700"   :
                  ps === "FAILED"        ? "bg-red-100 text-red-600"     :
                  ps === "REFUNDED"      ? "bg-purple-100 text-purple-700":
                                           "bg-yellow-100 text-yellow-700";
                return (
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md ${cfg}`}>
                    {ps?.replace(/_/g," ")}
                  </span>
                );
              })()}
            </div>

            {/* Status selector */}
            <label className="block text-xs text-gray-500 mb-1">Payment Status</label>
            <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 mb-3 outline-none focus:border-navy">
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            <label className="block text-xs text-gray-500 mb-1">Payment Method</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-3 outline-none focus:border-navy">
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online Payment</option>
            </select>

            <label className="block text-xs text-gray-500 mb-1">Payment Received Date</label>
            <input type="date" value={paymentReceivedDate} onChange={e => setPayRecDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 mb-3 outline-none focus:border-navy" />

            <label className="block text-xs text-gray-500 mb-1">Bank Deposit Reference</label>
            <input value={bankDepositRef} onChange={e => setBankRef(e.target.value)}
              placeholder="e.g. DEP-2025-00123"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 mb-3 outline-none focus:border-navy" />

            <label className="block text-xs text-gray-500 mb-1">Amount Received (PGK)</label>
            <input type="number" min="0" step="0.01" value={amountReceived} onChange={e => setAmountReceived(e.target.value)}
              placeholder={String(order.total)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 mb-3 outline-none focus:border-navy" />

            <label className="block text-xs text-gray-500 mb-1">Payment Notes</label>
            <textarea value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)}
              placeholder="Internal payment notes…" rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 mb-3 outline-none focus:border-navy resize-none" />

            <button onClick={handleSavePayment} disabled={savingPayment}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-50 transition-colors">
              {savingPayment ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save Payment</>}
            </button>
            {paymentStatus === "PAID" && (
              <p className="text-xs text-green-600 text-center mt-2 font-semibold">
                ✓ Customer & superior will be notified
              </p>
            )}
          </div>

          {/* Admin notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-extrabold text-sm text-gray-900 mb-3 flex items-center gap-2"><Edit3 size={14} /> Admin Notes</p>
            <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
              placeholder="Internal notes (not visible to customer)…"
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 mb-3 outline-none focus:border-navy resize-none" />
            <button onClick={handleSaveDetails} disabled={saving}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 text-sm font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
              {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Save Notes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
