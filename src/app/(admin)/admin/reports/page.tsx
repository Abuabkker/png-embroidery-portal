"use client";
import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Download, FileSpreadsheet, Printer, TrendingUp, ShoppingBag,
  Users, DollarSign, Package, RefreshCw, UserCheck,
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

type KPIs = { totalRevenue: number; dailyRevenue: number; weeklyRevenue: number; monthlyRevenue: number; yearlyRevenue: number; totalOrders: number; activeOrders: number; avgOrderValue: number; totalCustomers: number; totalSuperior: number; newCustomersThisMonth: number };
type Bucket = { label: string; revenue: number; orders: number };
type ProductRow = { name: string; image: string | null; qty: number; revenue: number };
type CustomerRow = { name: string; email: string; role: string; orders: number; revenue: number; lastOrder: string };
type StatusRow = { status: string; count: number };
type OrderRow = { id: string; orderNumber: string; customer: { name: string | null; email: string; role: string }; total: number; status: string; paymentStatus: string; itemCount: number; createdAt: string };
type ReportData = { kpis: KPIs; timeSeries: Bucket[]; topProducts: ProductRow[]; customerReport: CustomerRow[]; superiorReport: CustomerRow[]; statusReport: StatusRow[]; recentOrders: OrderRow[] };

const TABS = [
  { key: "overview",  label: "Revenue Overview" },
  { key: "orders",    label: "Recent Orders" },
  { key: "products",  label: "Top Products" },
  { key: "customers", label: "Customers" },
  { key: "superior",  label: "Superior Accounts" },
] as const;

export default function AdminReportsPage() {
  const [period, setPeriod]     = useState<"daily" | "weekly" | "monthly">("monthly");
  const [data, setData]         = useState<ReportData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["key"]>("overview");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/reports?period=${period}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function trigger(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a   = Object.assign(document.createElement("a"), { href: url, download: name });
    a.click(); URL.revokeObjectURL(url);
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
        doc.setFontSize(16); doc.text("PNG Embroidery — Business Analytics Report", 14, 18);
        doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
        if (data) {
          let y = 35;
          doc.text(`Total Revenue: ${formatCurrency(data.kpis.totalRevenue)}  |  Orders: ${data.kpis.totalOrders}  |  Customers: ${data.kpis.totalCustomers}`, 14, y); y += 12;
          autoTable(doc, {
            startY: y,
            head: [["Customer","Email","Orders","Revenue","Last Order"]],
            body: (data.customerReport || []).map(r => [r.name, r.email, r.orders, formatCurrency(r.revenue), new Date(r.lastOrder).toLocaleDateString()]),
          });
        }
        doc.save("admin-business-report.pdf");
      })
    );
  }

  const activeRows = (): Record<string, any>[] => {
    if (!data) return [];
    switch (activeTab) {
      case "products":  return data.topProducts;
      case "customers": return data.customerReport;
      case "superior":  return data.superiorReport;
      case "orders":    return data.recentOrders;
      default:          return data.timeSeries;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Full business performance — revenue, sales, customers</p>
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
          <button onClick={fetchData} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({length:8}).map((_,i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Revenue KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: DollarSign, label: "Total Revenue",      value: formatCurrency(data?.kpis.totalRevenue ?? 0),   sub: `Today: ${formatCurrency(data?.kpis.dailyRevenue ?? 0)}`,         color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: DollarSign, label: "This Month",         value: formatCurrency(data?.kpis.monthlyRevenue ?? 0), sub: `This week: ${formatCurrency(data?.kpis.weeklyRevenue ?? 0)}`,      color: "text-navy",        bg: "bg-blue-50" },
              { icon: DollarSign, label: "This Year",          value: formatCurrency(data?.kpis.yearlyRevenue ?? 0),  sub: `Avg per order: ${formatCurrency(data?.kpis.avgOrderValue ?? 0)}`, color: "text-purple-600",  bg: "bg-purple-50" },
              { icon: TrendingUp, label: "Avg Order Value",    value: formatCurrency(data?.kpis.avgOrderValue ?? 0),  sub: `Active orders: ${data?.kpis.activeOrders ?? 0}`,                   color: "text-amber-600",   bg: "bg-amber-50" },
            ].map(({ icon: Icon, label, value, sub, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center ${color}`}>
                    <Icon size={17} strokeWidth={2} />
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Operations KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: ShoppingBag, label: "Total Orders",      value: data?.kpis.totalOrders ?? 0,        sub: `Active: ${data?.kpis.activeOrders ?? 0}`,                  color: "text-blue-600",   bg: "bg-blue-50" },
              { icon: Users,       label: "Total Customers",   value: data?.kpis.totalCustomers ?? 0,     sub: `New this month: ${data?.kpis.newCustomersThisMonth ?? 0}`, color: "text-teal-600",   bg: "bg-teal-50" },
              { icon: UserCheck,   label: "Superior Accounts", value: data?.kpis.totalSuperior ?? 0,      sub: "Account managers",                                         color: "text-indigo-600", bg: "bg-indigo-50" },
              { icon: Package,     label: "Units Sold",        value: data?.topProducts?.reduce((s,p)=>s+p.qty,0) ?? 0, sub: `${data?.topProducts?.length ?? 0} products`, color: "text-rose-600",   bg: "bg-rose-50" },
            ].map(({ icon: Icon, label, value, sub, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center ${color}`}>
                    <Icon size={17} strokeWidth={2} />
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 px-6 pt-4 pb-0 gap-3">
              <div className="flex gap-1 overflow-x-auto">
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={`px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition-all -mb-px whitespace-nowrap
                      ${activeTab === t.key ? "border-navy text-navy bg-blue-50/50" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 pb-2">
                <button onClick={() => exportCSV(activeRows(), "admin-report")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                  <Download size={12} /> CSV
                </button>
                <button onClick={() => exportExcel(activeRows(), "admin-report")}
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
              {/* ── Revenue Overview ── */}
              {activeTab === "overview" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                      <DollarSign size={15} className="text-emerald-600" /> Revenue Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={data?.timeSeries || []} barSize={period === "daily" ? 6 : 20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={period === "daily" ? 4 : 0} />
                        <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`} />
                        <Tooltip formatter={(v: any) => [formatCurrency(v), "Revenue"]} contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #E5E7EB" }} />
                        <Bar dataKey="revenue" fill="#059669" radius={[4,4,0,0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                      <ShoppingBag size={15} className="text-navy" /> Order Volume
                    </h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={data?.timeSeries || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={period === "daily" ? 4 : 0} />
                        <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #E5E7EB" }} />
                        <Line dataKey="orders" stroke="#1E3A8A" strokeWidth={2} dot={false} name="Orders" />
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

              {/* ── Recent Orders ── */}
              {activeTab === "orders" && (
                <div>
                  <p className="text-xs text-gray-500 mb-4">20 most recent orders across all users</p>
                  {(data?.recentOrders?.length ?? 0) === 0 ? (
                    <div className="py-16 text-center"><ShoppingBag size={40} className="mx-auto text-gray-200 mb-3" /><p className="font-bold text-gray-500">No orders yet</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            {["Order","Customer","Role","Items","Total","Status","Date"].map(h => (
                              <th key={h} className="text-left py-3 px-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data?.recentOrders.map((o, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-3 px-3">
                                <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-bold text-navy hover:underline">{o.orderNumber}</Link>
                              </td>
                              <td className="py-3 px-3">
                                <p className="font-semibold text-gray-900 whitespace-nowrap">{o.customer.name}</p>
                                <p className="text-xs text-gray-400">{o.customer.email}</p>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.customer.role === "SUPERIOR_CUSTOMER" ? "bg-navy text-white" : "bg-gray-100 text-gray-600"}`}>
                                  {o.customer.role === "SUPERIOR_CUSTOMER" ? "SUPERIOR" : "CUSTOMER"}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-gray-600">{o.itemCount}</td>
                              <td className="py-3 px-3 font-bold text-gray-900 whitespace-nowrap">{formatCurrency(o.total)}</td>
                              <td className="py-3 px-3"><StatusBadge status={o.status} /></td>
                              <td className="py-3 px-3 text-gray-400 text-xs whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Top Products ── */}
              {activeTab === "products" && (
                <div>
                  <p className="text-xs text-gray-500 mb-4">Best-selling products by revenue</p>
                  {(data?.topProducts?.length ?? 0) === 0 ? (
                    <div className="py-16 text-center"><Package size={40} className="mx-auto text-gray-200 mb-3" /><p className="font-bold text-gray-500">No sales yet</p></div>
                  ) : (
                    <div className="space-y-3">
                      {data?.topProducts.map((row, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-colors">
                          <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                          {row.image ? (
                            <img src={row.image} alt={row.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><Package size={18} className="text-gray-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{row.name}</p>
                            <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-emerald-600 rounded-full h-1.5"
                                style={{ width: `${Math.min(100,(row.revenue/(data.topProducts[0]?.revenue||1))*100)}%` }} />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-emerald-700 text-sm">{formatCurrency(row.revenue)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{row.qty} units</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Customers ── */}
              {activeTab === "customers" && (
                <div>
                  <p className="text-xs text-gray-500 mb-4">Standard customers ranked by total revenue</p>
                  {(data?.customerReport?.length ?? 0) === 0 ? (
                    <div className="py-16 text-center"><Users size={40} className="mx-auto text-gray-200 mb-3" /><p className="font-bold text-gray-500">No purchases yet</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            {["Customer","Orders","Total Revenue","Avg Order","Last Purchase"].map(h => (
                              <th key={h} className="text-left py-3 px-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data?.customerReport.map((row, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-3.5 px-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {row.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 whitespace-nowrap">{row.name}</p>
                                    <p className="text-xs text-gray-400">{row.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-3 font-bold text-gray-900">{row.orders}</td>
                              <td className="py-3.5 px-3 font-bold text-emerald-700 whitespace-nowrap">{formatCurrency(row.revenue)}</td>
                              <td className="py-3.5 px-3 text-gray-600 whitespace-nowrap">{formatCurrency(row.orders ? row.revenue / row.orders : 0)}</td>
                              <td className="py-3.5 px-3 text-gray-500 whitespace-nowrap">{new Date(row.lastOrder).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Superior Accounts ── */}
              {activeTab === "superior" && (
                <div>
                  <p className="text-xs text-gray-500 mb-4">Superior customer accounts and their purchasing activity</p>
                  {(data?.superiorReport?.length ?? 0) === 0 ? (
                    <div className="py-16 text-center">
                      <UserCheck size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="font-bold text-gray-500">No superior account purchases yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            {["Account Manager","Orders","Total Purchased","Avg Order","Last Activity"].map(h => (
                              <th key={h} className="text-left py-3 px-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data?.superiorReport.map((row, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-3.5 px-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {row.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 whitespace-nowrap">{row.name}</p>
                                    <p className="text-xs text-gray-400">{row.email}</p>
                                    <span className="text-[9px] font-bold bg-navy text-white rounded-full px-1.5 py-0.5">SUPERIOR</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-3 font-bold text-gray-900">{row.orders}</td>
                              <td className="py-3.5 px-3 font-bold text-navy whitespace-nowrap">{formatCurrency(row.revenue)}</td>
                              <td className="py-3.5 px-3 text-gray-600 whitespace-nowrap">{formatCurrency(row.orders ? row.revenue / row.orders : 0)}</td>
                              <td className="py-3.5 px-3 text-gray-500 whitespace-nowrap">{new Date(row.lastOrder).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
