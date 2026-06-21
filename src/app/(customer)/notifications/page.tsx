"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ShoppingBag, Package, AlertCircle, Info, Filter } from "lucide-react";

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  order_confirmed: { icon: ShoppingBag, color: "text-green-600 bg-green-50",  label: "Order" },
  order_placed:    { icon: ShoppingBag, color: "text-blue-600 bg-blue-50",    label: "Order" },
  order_update:    { icon: Package,     color: "text-purple-600 bg-purple-50", label: "Update" },
  proof_ready:     { icon: AlertCircle, color: "text-amber-600 bg-amber-50",  label: "Proof" },
  shipped:         { icon: Package,     color: "text-indigo-600 bg-indigo-50", label: "Shipped" },
  system:          { icon: Info,        color: "text-gray-600 bg-gray-100",    label: "System" },
};

const FILTERS = ["All", "Order", "Update", "Proof", "Shipped", "System"];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread]               = useState(0);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState("All");

  const fetchNotifs = useCallback(async () => {
    const res  = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.data || []);
    setUnread(data.unreadCount ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  }

  const filtered = notifications.filter(n => {
    if (filter === "All") return true;
    const meta = TYPE_META[n.type];
    return meta?.label === filter;
  });

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-gray-900">Notifications</h1>
          {unread > 0 && (
            <span className="bg-navy text-white text-xs font-bold rounded-full px-2.5 py-0.5">{unread} unread</span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 text-sm font-semibold text-navy hover:text-blue-900 transition-colors">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
        <Filter size={13} className="text-gray-400 shrink-0" />
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all
              ${filter === f ? "bg-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({length:5}).map((_,i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <Bell size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="font-bold text-gray-600">No notifications</p>
          <p className="text-sm text-gray-400 mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const meta  = TYPE_META[n.type] ?? TYPE_META["system"];
            const Icon  = meta.icon;
            const href  = n.orderId ? `/orders/${n.orderId}` : "#";

            return (
              <div key={n.id}
                className={`flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer
                  ${n.isRead ? "bg-white border-gray-100" : "bg-blue-50/40 border-blue-100"}`}
                onClick={() => !n.isRead && markRead(n.id)}>

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                  <Icon size={18} strokeWidth={1.8} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-bold ${n.isRead ? "text-gray-700" : "text-gray-900"} leading-snug`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                  {n.orderId && (
                    <Link href={href} onClick={e => e.stopPropagation()}
                      className="mt-1.5 inline-block text-[11px] font-bold text-navy hover:underline">
                      View Order →
                    </Link>
                  )}
                </div>

                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-navy mt-2 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
