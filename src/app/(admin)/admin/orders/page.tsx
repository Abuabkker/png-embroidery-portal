"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Download, ChevronRight, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";

const STATUSES = [
  "ALL","PENDING_CONFIRMATION","CONFIRMED","ORDER_RECEIVED","IN_REVIEW",
  "PROOF_SENT","IN_PRODUCTION","QUALITY_CHECK","SHIPPED","DELIVERED","CANCELLED",
];

const STATUS_LABELS: Record<string, string> = {
  ALL: "All", PENDING_CONFIRMATION: "Pending", CONFIRMED: "Confirmed",
  ORDER_RECEIVED: "Received", IN_REVIEW: "In Review", PROOF_SENT: "Proof Sent",
  IN_PRODUCTION: "In Production", QUALITY_CHECK: "QC", SHIPPED: "Shipped",
  DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [counts, setCounts]     = useState<Record<string, number>>({});

  function load() {
    setLoading(true);
    const p = new URLSearchParams({ limit: "100" });
    if (status !== "ALL") p.set("status", status);
    if (search)   p.set("search", search);
    if (dateFrom) p.set("from", dateFrom);
    if (dateTo)   p.set("to", dateTo);
    fetch(`/api/admin/orders?${p}`)
      .then(r => r.json())
      .then(d => {
        setOrders(d.data || []);
        setCounts(d.counts || {});
        setLoading(false);
      });
  }

  useEffect(() => { load(); }, [status, search, dateFrom, dateTo]);

  function exportCSV() {
    const rows = [
      ["Order #", "Customer", "Email", "Items", "Total", "Status", "Date"],
      ...orders.map(o => [
        o.orderNumber, o.user?.name, o.user?.email,
        o.items?.length,
        Number(o.total).toFixed(2),
        o.status,
        new Date(o.createdAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map(r => r.map(String).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  const pending = orders.filter(o => o.status === "PENDING_CONFIRMATION");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Order Management</h1>
        <button onClick={exportCSV}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Pending confirmation alert */}
      {pending.length > 0 && status === "ALL" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-3 mb-5 flex items-center justify-between">
          <p className="text-sm font-semibold text-yellow-800">
            {pending.length} order{pending.length > 1 ? "s" : ""} awaiting your confirmation
          </p>
          <button onClick={() => setStatus("PENDING_CONFIRMATION")}
            className="text-xs font-bold text-yellow-700 underline underline-offset-2">
            View pending →
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customer or order ID…"
            className="text-sm outline-none w-48" />
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Calendar size={13} className="text-gray-400" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-sm outline-none text-gray-700" />
          <span className="text-gray-300 text-xs">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-sm outline-none text-gray-700" />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors ${
              status === s ? "bg-navy text-white border-navy" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"}`}>
            {STATUS_LABELS[s]}
            {s === "PENDING_CONFIRMATION" && counts[s] > 0 && (
              <span className="ml-1.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{counts[s]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[140px_1fr_1fr_100px_180px_80px_28px] px-5 py-3 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <span>Order</span><span>Customer</span><span>Products</span><span>Amount</span><span>Status</span><span>Date</span><span></span>
        </div>

        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 m-2 bg-gray-50 rounded-xl animate-pulse" />
            ))
          : orders.length === 0
          ? (
            <div className="py-16 text-center text-gray-400">
              <p className="font-semibold">No orders found</p>
            </div>
          )
          : orders.map(o => (
            <Link key={o.id} href={`/admin/orders/${o.id}`}
              className={`grid grid-cols-[140px_1fr_1fr_100px_180px_80px_28px] px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors text-sm items-center
                ${o.status === "PENDING_CONFIRMATION" ? "bg-yellow-50/50 hover:bg-yellow-50" : ""}`}>
              <span className="font-bold text-navy text-xs">#{o.orderNumber}</span>
              <div>
                <p className="font-semibold text-gray-900 text-xs">{o.user?.name || "—"}</p>
                <p className="text-[10px] text-gray-400">{o.user?.email}</p>
              </div>
              <span className="text-gray-600 text-xs truncate">
                {o.items?.[0]?.productName}{o.items?.length > 1 ? ` +${o.items.length - 1} more` : ""}
              </span>
              <span className="font-bold text-xs">{formatCurrency(Number(o.total))}</span>
              <StatusBadge status={o.status} />
              <span className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</span>
              <ChevronRight size={14} className="text-gray-300" />
            </Link>
          ))}
      </div>

      {!loading && (
        <p className="text-xs text-gray-400 mt-3 text-right">{orders.length} order{orders.length !== 1 ? "s" : ""} shown</p>
      )}
    </div>
  );
}
