"use client";
import { useState, useEffect } from "react";
import { Search, Users } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetch("/api/admin/customers").then(r => r.json()).then(d => { setCustomers(d.data || []); setLoading(false); }); }, []);

  const filtered = customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Customer Management</h1>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-72 mb-5">
        <Search size={14} className="text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="text-sm outline-none flex-1" />
      </div>
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_100px_100px] px-5 py-3 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <span>Customer</span><span>Email</span><span>Orders</span><span>Joined</span>
        </div>
        {loading ? Array.from({length:8}).map((_,i) => <div key={i} className="h-14 m-2 bg-gray-50 rounded-xl animate-pulse" />) :
         filtered.map(c => (
          <div key={c.id} className="grid grid-cols-[1fr_1fr_100px_100px] px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 text-sm items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{c.name?.[0]?.toUpperCase() || "?"}</div>
              <span className="font-semibold text-gray-900">{c.name || "—"}</span>
            </div>
            <span className="text-gray-500 text-xs">{c.email}</span>
            <span className="font-bold text-gray-900">{c._count?.orders || 0}</span>
            <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400"><Users size={32} className="mx-auto mb-2 opacity-30" /><p>No customers found</p></div>
        )}
      </div>
    </div>
  );
}
