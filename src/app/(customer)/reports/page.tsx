"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Download, FileSpreadsheet, Printer, TrendingUp, ShoppingBag,
  Users, DollarSign, Package, RefreshCw, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "#10B981", ORDER_RECEIVED: "#6366F1", IN_REVIEW: "#A855F7",
  PROOF_SENT: "#3B82F6", PROOF_APPROVED: "#14B8A6", IN_PRODUCTION: "#F59E0B",
  QUALITY_CHECK: "#6366F1", SHIPPED: "#8B5CF6", DELIVERED: "#059669", CANCELLED: "#EF4444",
};
const CHART_COLORS = ["#1E3A8A","#2563EB","#60A5FA","#93C5FD","#BFDBFE","#DBEAFE"];

type KPIs = { totalSpent: number; totalOrders: number; avgPurchase: number; teamMembers: number; dailySpent: number; weeklySpent: number; monthlySpent: number };
type Bucket = { label: string; totalSpent: number; orders: number };
type ProductRow = { name: string; image: string | null; qty: number; totalSpent: number };
type TeamRow = { name: string; email: string; orders: number; totalSpent: number; lastOrder: string; products: string[] };
type StatusRow = { status: string; count: number };
type ActivityItem = { memberName: string; memberEmail: string; productName: string; productImage: string | null; quantity: number; spent: number; orderNumber: string; orderId: string; date: string; customization: any };
type ReportData = { kpis: KPIs; timeSeries: Bucket[]; productReport: ProductRow[]; teamReport: TeamRow[]; teamActivity: ActivityItem[]; statusReport: StatusRow[] };

export default function SuperiorReportsPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [data, setData]     = useState<ReportData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "team" | "products" | "activity">("overview");
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/reports/customer?period=${period}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function trigger(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a   = Object.assign(document.createElement("a"), { href: url, download: name });
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportCSV(rows: Record<string, any>[], filename: string) {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv  = [keys.join(","), ...rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g,'""')}"`).join(","))].join("\n");
    trigger(new Blob([csv], { type: "text/csv" }), `${filename}.csv`);
  }
  function exportExcel(rows: Record<string, any>[], filename: string) {
    import("xlsx").then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    });
  }
  function exportPDF() {
    import("jspdf").then(({ default: jsPDF }) =>
      import("jspdf-autotable").then(({ default: autoTable }) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Team Purchase Report", 14, 18);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
        let y = 35;
        if (data) {
          doc.text(`Total Purchases: ${formatCurrency(data.kpis.totalSpent)}  |  Orders: ${data.kpis.totalOrders}  |  Team Members: ${data.kpis.teamMembers}`, 14, y);
          y += 12;
          autoTable(doc, {
            startY: y,
            head: [["Member","Email","Orders","Total Purchased","Last Purchase"]],
            body: (data.teamReport || []).map(r => [
              r.name, r.email, r.orders, formatCurrency(r.totalSpent),
              new Date(r.lastOrder).toLocaleDateString(),
            ]),
          });
        }
        doc.save("team-purchase-report.pdf");
      })
    );
  }

  const activeRows = () =>
    activeTab === "team"     ? (data?.teamReport    ?? []) :
    activeTab === "products" ? (data?.productReport ?? []) :
                               (data?.teamActivity  ?? []);

  const TABS = [
    { key: "overview",  label: "Overview" },
    { key: "team",      label: "Team Members" },
    { key: "products",  label: "Products" },
    { key: "activity",  label: "Team Activity" },
  ] as const;

  return (
    <div ref={printRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Team Purchase Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor your team&apos;s purchasing activity and order trends</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(["daily","weekly","monthly"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${period === p ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50" title="Refresh">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({length:4}).map((_,i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: DollarSign, label: "Total Purchases",     value: formatCurrency(data?.kpis.totalSpent ?? 0),  sub: `This month: ${formatCurrency(data?.kpis.monthlySpent ?? 0)}`,   color: "text-navy" },
              { icon: ShoppingBag, label: "Total Orders",       value: data?.kpis.totalOrders ?? 0,                 sub: `This week: ${formatCurrency(data?.kpis.weeklySpent ?? 0)}`,      color: "text-purple-600" },
              { icon: TrendingUp,  label: "Avg Purchase Value", value: formatCurrency(data?.kpis.avgPurchase ?? 0), sub: "Per order average",                                               color: "text-emerald-600" },
              { icon: Users,       label: "Team Members",       value: data?.kpis.teamMembers ?? 0,                 sub: "Members with orders",                                             color: "text-amber-600" },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center ${color}`}>
                    <Icon size={17} strokeWidth={2} />
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Tabs + export */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 px-6 pt-4 pb-0 gap-3">
              <div className="flex gap-1">
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={`px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition-all -mb-px
                      ${activeTab === t.key ? "border-navy text-navy bg-blue-50/50" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 pb-2">
                <button onClick={() => exportCSV(activeRows(), "team-purchases")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                  <Download size={12} /> CSV
                </button>
                <button onClick={() => exportExcel(activeRows(), "team-purchases")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                  <FileSpreadsheet size={12} /> Excel
                </button>
                <button onClick={exportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                  <Download size={12} /> PDF
                </button>
                <button onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                  <Printer size={12} /> Print
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* ── Overview ── */}
              {activeTab === "overview" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp size={15} className="text-navy" /> Team Purchase Trends
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data?.timeSeries || []} barSize={period === "daily" ? 6 : 18}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={period === "daily" ? 4 : 0} />
                        <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`} />
                        <Tooltip formatter={(v: any) => [formatCurrency(v), "Purchases"]} contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #E5E7EB" }} />
                        <Bar dataKey="totalSpent" fill="#1E3A8A" radius={[4,4,0,0]} name="Purchases" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                      <ShoppingBag size={15} className="text-purple-600" /> Order Volume
                    </h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={data?.timeSeries || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={period === "daily" ? 4 : 0} />
                        <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #E5E7EB" }} />
                        <Line dataKey="orders" stroke="#7C3AED" strokeWidth={2} dot={false} name="Orders" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {(data?.statusReport?.length ?? 0) > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                          <Package size={15} className="text-amber-600" /> Orders by Status
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={data?.statusReport} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80}>
                              {data?.statusReport.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.status] || CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v, n) => [v, String(n).replace(/_/g," ")]} contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #E5E7EB" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 mt-4">
                        {data?.statusReport.map(s => (
                          <div key={s.status} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <StatusBadge status={s.status} />
                            <span className="font-bold text-gray-900 text-sm">{s.count} orders</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Team Members ── */}
              {activeTab === "team" && (
                <div>
                  <p className="text-xs text-gray-500 mb-4">Purchase breakdown per team member</p>
                  {(data?.teamReport?.length ?? 0) === 0 ? (
                    <div className="py-16 text-center">
                      <Users size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="font-bold text-gray-500">No team purchases yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            {["Team Member","Orders","Total Purchased","Avg per Order","Last Purchase","Items Purchased"].map(h => (
                              <th key={h} className="text-left py-3 px-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data?.teamReport.map((row, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-3.5 px-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {row.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 whitespace-nowrap">{row.name}</p>
                                    <p className="text-xs text-gray-400">{row.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-3 font-bold text-gray-900">{row.orders}</td>
                              <td className="py-3.5 px-3 font-bold text-navy whitespace-nowrap">{formatCurrency(row.totalSpent)}</td>
                              <td className="py-3.5 px-3 text-gray-600 whitespace-nowrap">{formatCurrency(row.orders ? row.totalSpent / row.orders : 0)}</td>
                              <td className="py-3.5 px-3 text-gray-500 whitespace-nowrap">{new Date(row.lastOrder).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</td>
                              <td className="py-3.5 px-3 max-w-[200px]">
                                <div className="flex flex-wrap gap-1">
                                  {row.products.slice(0,3).map((p,j) => (
                                    <span key={j} className="text-[10px] bg-blue-50 text-blue-700 rounded-md px-1.5 py-0.5 font-semibold">{p}</span>
                                  ))}
                                  {row.products.length > 3 && <span className="text-[10px] text-gray-400">+{row.products.length - 3} more</span>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Products ── */}
              {activeTab === "products" && (
                <div>
                  <p className="text-xs text-gray-500 mb-4">Products purchased by your team, ranked by total spend</p>
                  {(data?.productReport?.length ?? 0) === 0 ? (
                    <div className="py-16 text-center">
                      <Package size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="font-bold text-gray-500">No product purchases yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data?.productReport.map((row, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-colors">
                          <span className="w-7 h-7 rounded-lg bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                          {row.image ? (
                            <img src={row.image} alt={row.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                              <Package size={18} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{row.name}</p>
                            <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-navy rounded-full h-1.5 transition-all"
                                style={{ width: `${Math.min(100, (row.totalSpent / (data.productReport[0]?.totalSpent || 1)) * 100)}%` }} />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-navy text-sm">{formatCurrency(row.totalSpent)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{row.qty} units</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Team Activity ── */}
              {activeTab === "activity" && (
                <div>
                  <p className="text-xs text-gray-500 mb-4">Latest purchases across your team (most recent first)</p>
                  {(data?.teamActivity?.length ?? 0) === 0 ? (
                    <div className="py-16 text-center">
                      <ShoppingBag size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="font-bold text-gray-500">No team activity yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data?.teamActivity.map((item, i) => {
                        const custom = item.customization as any;
                        return (
                          <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50/40 transition-colors">
                            <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {item.memberName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900 text-sm">{item.memberName}</span>
                                <span className="text-gray-400 text-xs">purchased</span>
                                <span className="font-semibold text-navy text-sm">{item.productName}</span>
                                {custom?.color && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-semibold">{custom.color}</span>}
                                {custom?.size  && <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-md font-semibold">{custom.size}</span>}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                <span className="text-xs text-gray-400">{item.quantity} unit{item.quantity !== 1 ? "s" : ""}</span>
                                <span className="text-[10px] text-gray-300">·</span>
                                <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
                                <span className="text-[10px] text-gray-300">·</span>
                                <span className="text-xs text-gray-400 font-mono">{item.orderNumber}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-gray-900 text-sm">{formatCurrency(item.spent)}</p>
                              <Link href={`/orders/${item.orderId}`}
                                className="text-[10px] text-navy font-bold hover:underline flex items-center gap-0.5 mt-0.5 justify-end">
                                View Order <ChevronRight size={10} />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
