"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Download, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";

const STATUSES = ["ALL","CONFIRMED","ORDER_RECEIVED","IN_REVIEW","PROOF_SENT","IN_PRODUCTION","QUALITY_CHECK","SHIPPED","DELIVERED","CANCELLED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: "50" });
    if (status !== "ALL") p.set("status", status);
    if (search) p.set("search", search);
    fetch(`/api/admin/orders?${p}`).then(r => r.json()).then(d => { setOrders(d.data || []); setLoading(false); });
  }, [status, search]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Order Management</h1>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer or order ID..." className="text-sm outline-none w-48" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`text-xs font-semibold rounded-full px-3 py-1.5 border ${status === s ? "bg-navy text-white border-navy" : "bg-white text-gray-600 border-gray-300"}`}>
              {s === "ALL" ? "All" : s.replace(/_/g," ")}
            </button>
          ))}
        </div>
        <button className="ml-auto flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          <Download size={14} /> Export
        </button>
      </div>
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[140px_1fr_1fr_100px_170px_80px_32px] px-5 py-3 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <span>Order ID</span><span>Customer</span><span>Product</span><span>Amount</span><span>Status</span><span>Date</span><span></span>
        </div>
        {loading ? Array.from({length:6}).map((_,i) => <div key={i} className="h-14 m-2 bg-gray-50 rounded-xl animate-pulse" />) :
         orders.map(o => (
          <Link key={o.id} href={`/admin/orders/${o.id}`} className="grid grid-cols-[140px_1fr_1fr_100px_170px_80px_32px] px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors text-sm items-center">
            <span className="font-bold text-navy text-xs">#{o.orderNumber}</span>
            <span className="font-semibold text-gray-900">{o.user?.name || "—"}</span>
            <span className="text-gray-600 text-xs truncate">{o.items?.[0]?.productName}{o.items?.length > 1 ? ` +${o.items.length-1}` : ""}</span>
            <span className="font-bold">{formatCurrency(Number(o.total))}</span>
            <StatusBadge status={o.status} />
            <span className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</span>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
