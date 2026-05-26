"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Package, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("ALL");

  useEffect(() => {
    fetch("/api/orders").then(r => r.json()).then(d => { setOrders(d.data || []); setLoading(false); });
  }, []);

  const tabs = ["ALL","ORDER_RECEIVED","IN_PRODUCTION","PROOF_SENT","SHIPPED","DELIVERED"];
  const filtered = orders.filter(o =>
    (tab === "ALL" || o.status === tab) &&
    o.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">My Orders</h1>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="text-sm outline-none" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`text-xs font-semibold rounded-full px-3 py-1.5 border ${tab === t ? "bg-navy text-white border-navy" : "bg-white text-gray-600 border-gray-300"}`}>
              {t.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_120px_100px_32px] gap-4 px-5 py-3 bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <span>Order</span><span>Total</span><span>Status</span><span>Date</span><span></span>
        </div>
        {loading ? Array.from({length:5}).map((_,i) => <div key={i} className="h-16 bg-gray-50 animate-pulse m-2 rounded-xl" />) :
         filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p>No orders found</p>
          </div>
         ) : filtered.map(o => (
          <Link key={o.id} href={`/orders/${o.id}`} className="flex md:grid md:grid-cols-[2fr_1fr_120px_100px_32px] gap-4 items-center px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                {o.items?.[0]?.productImage ? <img src={o.items[0].productImage} alt="" className="w-full h-full object-contain p-1" /> : <Package size={18} className="text-gray-400" />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">{o.items?.[0]?.productName || "Order"}{o.items?.length > 1 ? ` +${o.items.length-1}` : ""}</p>
                <p className="text-xs text-gray-400">#{o.orderNumber}</p>
              </div>
            </div>
            <span className="font-bold text-sm text-gray-900">{formatCurrency(Number(o.total))}</span>
            <StatusBadge status={o.status} />
            <span className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</span>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
