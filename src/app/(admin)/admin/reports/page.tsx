"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/admin/reports").then(r => r.json()).then(d => setData(d.data)); }, []);

  const monthlyData = [
    {month:"Jan",revenue:8400},{month:"Feb",revenue:11200},{month:"Mar",revenue:9800},
    {month:"Apr",revenue:13600},{month:"May",revenue:16200},{month:"Jun",revenue:13800},
    {month:"Jul",revenue:17500},{month:"Aug",revenue:19100},{month:"Sep",revenue:18800},
    {month:"Oct",revenue:21600},{month:"Nov",revenue:24200},{month:"Dec",revenue:22800},
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Reports & Analytics</h1>
        <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ["Total Orders",    data?.totalOrders || 0,                                        "All time"],
          ["Month Orders",    data?.monthOrders || 0,                                         "This month"],
          ["Total Revenue",   formatCurrency(Number(data?.totalRevenue || 0)),                "All time"],
          ["Total Customers", data?.totalCustomers || 0,                                      "Registered"],
        ].map(([label, value, sub]) => (
          <div key={label as string} className="bg-white rounded-2xl p-5 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-2">{label as string}</p>
            <p className="text-2xl font-extrabold text-gray-900">{value as any}</p>
            <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1"><TrendingUp size={12} />{sub as string}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl p-6 mb-5">
        <h2 className="font-extrabold text-base mb-5">Monthly Revenue (Kina)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `K${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => formatCurrency(v)} labelStyle={{ fontWeight: "bold" }} />
            <Bar dataKey="revenue" fill="#2D2DB8" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Products */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="font-extrabold text-base mb-4">Top Products</h2>
          {data?.topProducts?.length ? data.topProducts.map((p: any, i: number) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold text-gray-900 truncate">{p.productName}</span>
                <span className="text-gray-500 ml-2 flex-shrink-0">{p._sum.quantity} units</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2">
                <div className="bg-navy rounded-full h-2" style={{ width: `${(p._sum.quantity / (data.topProducts[0]._sum.quantity || 1)) * 100}%` }} />
              </div>
            </div>
          )) : (
            [["Safety Helmets (all types)", 342], ["Hi-Vis Workwear Shirts", 298], ["Safety Boots", 187], ["Canvas Safety Vests", 164], ["Polo Shirts", 143]].map(([name, units]) => (
              <div key={name as string} className="mb-3">
                <div className="flex justify-between text-sm mb-1.5"><span className="font-semibold">{name as string}</span><span className="text-gray-400">{units as number} units</span></div>
                <div className="bg-gray-100 rounded-full h-2"><div className="bg-navy rounded-full h-2" style={{ width: `${((units as number) / 370) * 100}%` }} /></div>
              </div>
            ))
          )}
        </div>

        {/* Orders by status */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="font-extrabold text-base mb-4">Orders by Status</h2>
          {data?.byStatus?.length ? data.byStatus.map((s: any) => (
            <div key={s.status} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0 text-sm">
              <span className="text-gray-700">{s.status.replace(/_/g," ")}</span>
              <span className="font-bold text-gray-900">{s._count.id}</span>
            </div>
          )) : <p className="text-gray-400 text-sm text-center py-8">No order data yet</p>}
        </div>
      </div>
    </div>
  );
}
